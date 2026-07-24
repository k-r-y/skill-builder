import { GoogleGenAI } from '@google/genai';

/**
 * Builds the structured offline SKILL.md from the JSON data fields.
 * No LLM involved — the output is assembled deterministically from the schema.
 */
const buildOfflineOutput = (skill, categoryName, customNotes) => {
  const slug = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const description = skill.trigger || skill.howItWorks;

  const relatedLine = (skill.relatedSkills && skill.relatedSkills.length > 0)
    ? `> Commonly paired or confused with: ${skill.relatedSkills.join(', ')}. See those skills if this one doesn't match the task.\n\n`
    : '';

  const directivesList = (skill.directives || [])
    .map((rule, i) => `${i + 1}. ${rule}`)
    .join('\n');

  const antiPatternsList = (skill.antiPatterns || [])
    .map(rule => `- ${rule}`)
    .join('\n');

  const confirmationSection = (skill.scope?.requiresConfirmation?.length)
    ? `\n## Requires human confirmation before\n${skill.scope.requiresConfirmation.map(a => `- ${a}`).join('\n')}\n`
    : '';

  const constraintsSection = (customNotes && customNotes.trim())
    ? `\n## Project-specific constraints\n${customNotes.trim()}\n`
    : '';

  return `---
name: ${slug}
description: ${description}
---

# ${skill.name}

## When to use this
${relatedLine}${skill.trigger || description} This skill applies when working in the **${categoryName}** domain.

## How it works
${skill.howItWorks}

**Why it matters:** ${skill.whyItMatters}

## Steps
${directivesList}

## Never do this
${antiPatternsList}
${confirmationSection}${constraintsSection}`.trim();
};

/**
 * Builds the LLM system prompt that enforces the exact SKILL.md structure.
 */
const buildSystemPrompt = () => `You are a technical documentation writer generating agent skill files.
Your output must be a valid SKILL.md file — a machine-loadable instruction file for an autonomous agent runtime.

Follow this EXACT structure, in this exact order:

\`\`\`
---
name: <kebab-case slug of the skill name>
description: <the trigger sentence — one sentence describing the situation that causes an agent to load this skill>
---

# <Skill Title>

## When to use this
<1–2 sentences of concrete situations. If relatedSkills are provided, add one line: "Commonly paired or confused with: X, Y. See those skills if this one doesn't match the task.">

## How it works
<concise mechanic description>

## Steps
<ordered, imperative list — each step is a direct action, not an abstract principle>

## Never do this
<bullet list of anti-patterns>

[CONDITIONAL] ## Requires human confirmation before
<only include this section if scope.requiresConfirmation items are provided — list them verbatim as bullets>

[CONDITIONAL] ## Project-specific constraints
<only include this section if the user actually typed custom constraints — paste them verbatim, lightly cleaned>
\`\`\`

STRICT RULES:
- Start the output with --- (YAML frontmatter). Never start with a # heading.
- description must be a situational trigger sentence, not a restatement of the title.
- Never write "You are a ___" anywhere in the output. Write instructions directly.
- If no custom constraints were provided, omit "Project-specific constraints" entirely. Never generate placeholder text for it.
- If scope.requiresConfirmation is empty, omit that section entirely.
- Do not add extra sections, preamble, or closing remarks.`;

/**
 * Builds the user-facing prompt with full skill context.
 */
const buildUserPrompt = (skill, categoryName, customNotes) => {
  const relatedSkillsLine = (skill.relatedSkills?.length)
    ? `Related skills (for disambiguation note): ${skill.relatedSkills.join(', ')}`
    : '';

  const confirmationLine = (skill.scope?.requiresConfirmation?.length)
    ? `scope.requiresConfirmation (include verbatim as bullets in the "Requires human confirmation before" section):\n${skill.scope.requiresConfirmation.map(a => `- ${a}`).join('\n')}`
    : 'scope.requiresConfirmation: (empty — omit that section)';

  const constraintsLine = (customNotes && customNotes.trim())
    ? `Custom constraints (include verbatim in "Project-specific constraints" section):\n${customNotes.trim()}`
    : 'Custom constraints: (none — omit the "Project-specific constraints" section entirely)';

  return `Category: ${categoryName}
Skill name: ${skill.name}
Slug: ${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
Trigger (use as frontmatter description): ${skill.trigger || skill.howItWorks}
How it works: ${skill.howItWorks}
Why it matters: ${skill.whyItMatters}
Directives (convert to ordered imperative Steps list):
${(skill.directives || []).map((d, i) => `${i + 1}. ${d}`).join('\n')}
Anti-patterns (use as "Never do this" bullets):
${(skill.antiPatterns || []).map(a => `- ${a}`).join('\n')}
${relatedSkillsLine}
${confirmationLine}
${constraintsLine}

Generate the SKILL.md file now.`;
};

/**
 * Main export — dispatches to offline builder or LLM based on apiKey presence.
 */
export const generateSkill = async (selectedSkill, categoryName, customNotes, apiKey, useAI) => {
  if (!useAI || !apiKey || !apiKey.trim()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(buildOfflineOutput(selectedSkill, categoryName, customNotes));
      }, 400);
    });
  }

  const ai = new GoogleGenAI({ apiKey });

  const MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];
  let lastError;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: buildUserPrompt(selectedSkill, categoryName, customNotes),
        config: {
          systemInstruction: buildSystemPrompt(),
          temperature: 0.4,
        },
      });
      return response.text;
    } catch (err) {
      const msg = err.message || '';
      // Only try the next model if THIS model is simply unavailable for this key
      // Do NOT catch quota/rate-limit errors — they apply to all models equally
      if (msg.includes('no longer available') || (msg.includes('NOT_FOUND') && !msg.includes('RESOURCE_EXHAUSTED'))) {
        lastError = err;
        continue;
      }
      throw err; // quota errors, auth errors, network errors — re-throw immediately
    }
  }

  throw lastError;
};
