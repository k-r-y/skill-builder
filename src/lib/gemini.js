import { GoogleGenAI } from '@google/genai';

/**
 * Builds the structured offline SKILL.md.
 * If base skill exists, we append constraints. If custom-skill, we build a skeleton.
 */
const buildOfflineOutput = (selectedSkill, categoryName, customNotes) => {
  if (selectedSkill.id === 'custom-skill') {
    const skillName = selectedSkill.name || 'Custom Skill';
    const slug = skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const directivesList = customNotes
      ? customNotes.trim().split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n')
      : '1. [Add steps here]';

    return `---
name: ${slug}
description: Custom skill for ${skillName} in ${categoryName}.
category: ${categoryName}
version: 1.0.0
---

# ${skillName}

## When to use this
Use this skill when working on tasks related to ${skillName} in the **${categoryName}** domain.

## How it works
[Provide details on how this skill operates]

## Steps
${directivesList}

## Never do this
- Do not ignore the specified guidelines.
`.trim();
  }

  let content = selectedSkill.raw || '';
  if (customNotes && customNotes.trim()) {
    // Strip existing Project-specific constraints if they exist
    content = content.replace(/\n\n## Project-specific constraints[\s\S]*$/, '');
    
    const formattedNotes = customNotes
      .trim()
      .split('\n')
      .map(l => l.trim().startsWith('-') ? l : `- ${l}`)
      .join('\n');
      
    content += `\n\n## Project-specific constraints\n${formattedNotes}`;
  }
  return content;
};

/**
 * Builds the LLM system prompt that strictly enforces the SKILL.md structure.
 */
const buildSystemPrompt = () => 
  `You are an expert AI Agent Skill creator. Output ONLY a valid SKILL.md file starting with YAML frontmatter (---) containing name, description, category, and version. The body must be standard Markdown. Do not include conversational text or code fence wrappers.`;

/**
 * Builds the user-facing prompt based on skill context.
 */
const buildUserPrompt = (selectedSkill, categoryName, customNotes) => {
  if (selectedSkill.id === 'custom-skill') {
    const skillName = selectedSkill.name || 'Custom Skill';
    return `Category: ${categoryName}
Skill Name: ${skillName}

Requirements / Notes:
${customNotes || 'Generate a comprehensive skill.'}

Create a brand new, production-grade SKILL.md file for this skill from scratch. Follow the standard SKILL.md structure. Do not include any introductory or concluding text, only return the SKILL.md content.`;
  }

  return `Category: ${categoryName}
Base Skill File:
\`\`\`markdown
${selectedSkill.raw}
\`\`\`

Custom Constraints / Context:
${customNotes || 'None'}

Synthesize a customized, production-grade SKILL.md file incorporating the above custom constraints. Do not include any introductory or concluding text, only return the SKILL.md content.`;
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
