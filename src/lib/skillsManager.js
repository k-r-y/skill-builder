import { parseSkillMd } from '../utils/skillParser';
import fallbacks from './fallbacks.json';

const REPOS_TO_SCAN = [
  { owner: 'anthropics', repo: 'skills', branch: 'main' },
  { owner: 'LambdaTest', repo: 'agent-skills', branch: 'main' },
  { owner: 'VoltAgent', repo: 'awesome-agent-skills', branch: 'main' },
  { owner: 'emilkowalski', repo: 'skill', branch: 'main' }
];
const COMMUNITY_SKILLS_TO_SEED = [
  // Anthropic Skills
  {
    url: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/docx/SKILL.md',
    fallbackCategory: 'Office & Document Processing'
  },
  {
    url: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/xlsx/SKILL.md',
    fallbackCategory: 'Office & Document Processing'
  },
  {
    url: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/pptx/SKILL.md',
    fallbackCategory: 'Office & Document Processing'
  },
  {
    url: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf/SKILL.md',
    fallbackCategory: 'Office & Document Processing'
  },
  {
    url: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md',
    fallbackCategory: 'Creative & Design'
  },
  {
    url: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/canvas-design/SKILL.md',
    fallbackCategory: 'Creative & Design'
  },
  {
    url: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/algorithmic-art/SKILL.md',
    fallbackCategory: 'Creative & Design'
  },
  {
    url: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/SKILL.md',
    fallbackCategory: 'Developer Tools & Automation'
  },
  {
    url: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/SKILL.md',
    fallbackCategory: 'Developer Tools & Automation'
  },
  {
    url: 'https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md',
    fallbackCategory: 'Developer Tools & Automation'
  },
  
  // TestMu AI Skills (from VoltAgent awesome-agent-skills)
  {
    url: 'https://raw.githubusercontent.com/LambdaTest/agent-skills/main/playwright-skill/SKILL.md',
    fallbackCategory: 'QA & Test Automation'
  },
  {
    url: 'https://raw.githubusercontent.com/LambdaTest/agent-skills/main/cypress-skill/SKILL.md',
    fallbackCategory: 'QA & Test Automation'
  },
  {
    url: 'https://raw.githubusercontent.com/LambdaTest/agent-skills/main/jest-skill/SKILL.md',
    fallbackCategory: 'QA & Test Automation'
  },
  {
    url: 'https://raw.githubusercontent.com/LambdaTest/agent-skills/main/vitest-skill/SKILL.md',
    fallbackCategory: 'QA & Test Automation'
  },
  {
    url: 'https://raw.githubusercontent.com/LambdaTest/agent-skills/main/pytest-skill/SKILL.md',
    fallbackCategory: 'QA & Test Automation'
  },
  {
    url: 'https://raw.githubusercontent.com/LambdaTest/agent-skills/main/capybara-skill/SKILL.md',
    fallbackCategory: 'QA & Test Automation'
  },
  {
    url: 'https://raw.githubusercontent.com/LambdaTest/agent-skills/main/appium-skill/SKILL.md',
    fallbackCategory: 'QA & Test Automation'
  }
];
export const CATEGORY_MAP = {
  // 1. AI Agents & Vibe Coding
  'claude-api': 'AI Agents & Vibe Coding',
  'google-antigravity-sdk': 'AI Agents & Vibe Coding',
  'mcp-builder': 'AI Agents & Vibe Coding',
  'skill-creator': 'AI Agents & Vibe Coding',
  'workflow-skill-creator': 'AI Agents & Vibe Coding',

  // 2. UI/UX, Web Design & Visual Identity
  'brand-guidelines': 'UI/UX, Web Design & Visual Identity',
  'theme-factory': 'UI/UX, Web Design & Visual Identity',
  'frontend-design': 'UI/UX, Web Design & Visual Identity',
  'web-design-guidelines': 'UI/UX, Web Design & Visual Identity',
  'canvas-design': 'UI/UX, Web Design & Visual Identity',
  'algorithmic-art': 'UI/UX, Web Design & Visual Identity',
  'slack-gif-creator': 'UI/UX, Web Design & Visual Identity',
  'responsive-layouts': 'UI/UX, Web Design & Visual Identity',
  'web-artifacts-builder': 'UI/UX, Web Design & Visual Identity',
  'animation-vocabulary': 'UI/UX, Web Design & Visual Identity',
  'apple-design': 'UI/UX, Web Design & Visual Identity',
  'emil-design-eng': 'UI/UX, Web Design & Visual Identity',
  'find-animation-opportunities': 'UI/UX, Web Design & Visual Identity',
  'improve-animations': 'UI/UX, Web Design & Visual Identity',
  'pick-ui-library': 'UI/UX, Web Design & Visual Identity',
  'prototype': 'UI/UX, Web Design & Visual Identity',
  'review-animations': 'UI/UX, Web Design & Visual Identity',


  // 3. Full-Stack Infrastructure & Deployment
  'firebase-auth-basics': 'Full-Stack Infrastructure & Deployment',
  'firebase-firestore': 'Full-Stack Infrastructure & Deployment',
  'firebase-data-connect': 'Full-Stack Infrastructure & Deployment',
  'firebase-crashlytics': 'Full-Stack Infrastructure & Deployment',
  'firebase-app-hosting-basics': 'Full-Stack Infrastructure & Deployment',
  'firebase-remote-config-basics': 'Full-Stack Infrastructure & Deployment',
  'firebase-security-rules-auditor': 'Full-Stack Infrastructure & Deployment',
  'firebase-ai-logic-basics': 'Full-Stack Infrastructure & Deployment',
  'firebase-hosting-basics': 'Full-Stack Infrastructure & Deployment',
  'firebase-basics': 'Full-Stack Infrastructure & Deployment',
  'deploy-to-vercel': 'Full-Stack Infrastructure & Deployment',
  'vercel-cli-with-tokens': 'Full-Stack Infrastructure & Deployment',
  'vercel-optimize': 'Full-Stack Infrastructure & Deployment',
  'vercel-composition-patterns': 'Full-Stack Infrastructure & Deployment',
  'vercel-react-best-practices': 'Full-Stack Infrastructure & Deployment',
  'vercel-react-view-transitions': 'Full-Stack Infrastructure & Deployment',
  'vercel-react-native-skills': 'Full-Stack Infrastructure & Deployment',
  'android-cli': 'Full-Stack Infrastructure & Deployment',
  'xcode-project-setup': 'Full-Stack Infrastructure & Deployment',

  // 4. Performance, Debugging & Web Tools
  'chrome-devtools': 'Performance, Debugging & Web Tools',
  'troubleshooting': 'Performance, Debugging & Web Tools',
  'memory-leak-debugging': 'Performance, Debugging & Web Tools',
  'debug-optimize-lcp': 'Performance, Debugging & Web Tools',
  'a11y-debugging': 'Performance, Debugging & Web Tools',
  'modern-web-guidance': 'Performance, Debugging & Web Tools',
  'chrome-extensions': 'Performance, Debugging & Web Tools',

  // 6. Administration, Comms & Documentation
  'docx': 'Administration, Comms & Documentation',
  'pdf': 'Administration, Comms & Documentation',
  'pptx': 'Administration, Comms & Documentation',
  'xlsx': 'Administration, Comms & Documentation',
  'doc-coauthoring': 'Administration, Comms & Documentation',
  'internal-comms': 'Administration, Comms & Documentation',
  'writing-guidelines': 'Administration, Comms & Documentation',

  // 7. Bioinformatics & Scientific Computing
  'alphafold-database-fetch-and-analyze': 'Bioinformatics & Scientific Computing',
  'alphagenome-single-variant-analysis': 'Bioinformatics & Scientific Computing',
  'chembl-database': 'Bioinformatics & Scientific Computing',
  'clinical-trials-database': 'Bioinformatics & Scientific Computing',
  'clinvar-database': 'Bioinformatics & Scientific Computing',
  'dbsnp-database': 'Bioinformatics & Scientific Computing',
  'embl-ebi-ols': 'Bioinformatics & Scientific Computing',
  'encode-ccres-database': 'Bioinformatics & Scientific Computing',
  'ensembl-database': 'Bioinformatics & Scientific Computing',
  'foldseek-structural-search': 'Bioinformatics & Scientific Computing',
  'gnomad-database': 'Bioinformatics & Scientific Computing',
  'gtex-database': 'Bioinformatics & Scientific Computing',
  'human-protein-atlas-database': 'Bioinformatics & Scientific Computing',
  'interpro-database': 'Bioinformatics & Scientific Computing',
  'jaspar-database': 'Bioinformatics & Scientific Computing',
  'literature-search-arxiv': 'Bioinformatics & Scientific Computing',
  'literature-search-biorxiv': 'Bioinformatics & Scientific Computing',
  'literature-search-europepmc': 'Bioinformatics & Scientific Computing',
  'literature-search-openalex': 'Bioinformatics & Scientific Computing',
  'ncbi-sequence-fetch': 'Bioinformatics & Scientific Computing',
  'openfda-database': 'Bioinformatics & Scientific Computing',
  'opentargets-database': 'Bioinformatics & Scientific Computing',
  'pdb-database': 'Bioinformatics & Scientific Computing',
  'protein-sequence-msa': 'Bioinformatics & Scientific Computing',
  'protein-sequence-similarity-search': 'Bioinformatics & Scientific Computing',
  'pubchem-database': 'Bioinformatics & Scientific Computing',
  'pubmed-database': 'Bioinformatics & Scientific Computing',
  'pymol': 'Bioinformatics & Scientific Computing',
  'quickgo-database': 'Bioinformatics & Scientific Computing',
  'reactome-database': 'Bioinformatics & Scientific Computing',
  'string-database': 'Bioinformatics & Scientific Computing',
  'ucsc-conservation-and-tfbs': 'Bioinformatics & Scientific Computing',
  'unibind-database': 'Bioinformatics & Scientific Computing',
  'uniprot-database': 'Bioinformatics & Scientific Computing',
  'uv': 'Bioinformatics & Scientific Computing'
};

export function getCategoryForSkill(skillId, parsedCategory) {
  if (CATEGORY_MAP[skillId]) return CATEGORY_MAP[skillId];
  if (parsedCategory && parsedCategory !== 'General' && parsedCategory !== 'Community Skills') return parsedCategory;
  return 'Quality Assurance & Automated Testing';
}

/**
 * Retrieves the stored skills list from localStorage.
 * @returns {Array} Array of parsed skill objects.
 */
export function getStoredSkills() {
  try {
    const raw = localStorage.getItem('community_skills');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading community_skills from localStorage:', err);
    return [];
  }
}

/**
 * Saves a raw SKILL.md file to localStorage under the parsed ID/metadata.
 * @param {string} rawContent Raw markdown content of the SKILL.md file.
 * @returns {Object} The parsed and stored skill object.
 */
export function saveSkill(rawContent) {
  const parsed = parseSkillMd(rawContent);
  const slug = parsed.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const category = getCategoryForSkill(slug, parsed.metadata.category);
  
  const skillObj = {
    id: slug,
    raw: rawContent,
    metadata: {
      ...parsed.metadata,
      category: category
    },
    body: parsed.body,
    updatedAt: Date.now()
  };

  const stored = getStoredSkills();
  const index = stored.findIndex(s => s.id === slug);

  if (index !== -1) {
    stored[index] = { ...stored[index], ...skillObj };
  } else {
    stored.unshift(skillObj);
  }

  localStorage.setItem('community_skills', JSON.stringify(stored));
  return skillObj;
}

/**
 * Seeds default community skills from GitHub (with offline fallback metadata).
 */
export async function seedDefaultSkills() {
  const isSeeded = localStorage.getItem('community_skills_seeded') === 'true';
  const stored = getStoredSkills();
  if (isSeeded && stored.length > 0) {
    // If we have some, we can still fetch updates in background but not block UI
  }

  // 1. Seed initially with the local offline fallbacks immediately
  const initialSkills = [...stored];
  let seededNew = false;
  for (const [skillId, raw] of Object.entries(fallbacks)) {
    if (!raw) continue;

    const existingIdx = initialSkills.findIndex(s => s.id === skillId);
    const parsed = parseSkillMd(raw);
    const category = getCategoryForSkill(skillId, parsed.metadata.category);
    const name = (parsed.metadata.name && parsed.metadata.name !== 'Unnamed Skill') ? parsed.metadata.name : skillId;

    if (existingIdx !== -1) {
      const storedItem = initialSkills[existingIdx];
      const needsCategoryUpdate = storedItem.metadata?.category !== category;
      const needsNameUpdate = !storedItem.metadata?.name || storedItem.metadata.name === 'Unnamed Skill';

      if (needsCategoryUpdate || needsNameUpdate) {
        initialSkills[existingIdx].metadata = {
          ...storedItem.metadata,
          name: needsNameUpdate ? name : storedItem.metadata.name,
          category: category
        };
        initialSkills[existingIdx].raw = raw;
        seededNew = true;
      }
      continue;
    }

    initialSkills.push({
      id: skillId,
      raw: raw,
      metadata: {
        ...parsed.metadata,
        name: name,
        category: category
      },
      body: parsed.body,
      isSeeded: true,
      files: [] // no extra files for fallback
    });
    seededNew = true;
  }

  if (stored.length === 0 || seededNew) {
    localStorage.setItem('community_skills', JSON.stringify(initialSkills));
    localStorage.setItem('community_skills_seeded', 'true');
  }

  // 2. Asynchronously fetch fresh files from GitHub in the background
  try {
    const updatedSkills = [...initialSkills];
    let updatedAny = false;

    // Fetch trees for all repos
    const fetchPromises = REPOS_TO_SCAN.map(async ({ owner, repo, branch }) => {
      try {
        const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
        const res = await fetch(treeUrl);
        if (!res.ok) {
          console.warn(`Failed to fetch tree for ${owner}/${repo}`);
          return;
        }
        
        const data = await res.json();
        if (!data.tree) return;

        // Find all SKILL.md paths
        const skillNodes = data.tree.filter(node => 
          node.type === 'blob' && node.path.endsWith('SKILL.md')
        );

        // For each skill node, fetch content and group files
        const skillPromises = skillNodes.map(async (skillNode) => {
          const dirPath = skillNode.path.substring(0, skillNode.path.lastIndexOf('/'));
          const folderName = dirPath.split('/').pop() || 'unknown-skill';
          const skillId = folderName.toLowerCase();

          const relatedFiles = data.tree.filter(node => 
            node.type === 'blob' && 
            node.path !== skillNode.path && 
            node.path.startsWith(dirPath + '/')
          ).map(fileNode => ({
            path: fileNode.path.substring(dirPath.length + 1), // relative path
            url: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fileNode.path}`
          }));

          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${skillNode.path}`;
          
          try {
            const contentRes = await fetch(rawUrl);
            if (!contentRes.ok) return;
            const rawContent = await contentRes.text();
            
            if (rawContent && rawContent.includes('---')) {
              const parsed = parseSkillMd(rawContent);
              const category = getCategoryForSkill(skillId, parsed.metadata.category);
              const name = (parsed.metadata.name && parsed.metadata.name !== 'Unnamed Skill') ? parsed.metadata.name : skillId;

              const skillObj = {
                id: skillId,
                raw: rawContent,
                metadata: {
                  ...parsed.metadata,
                  name: name,
                  category: category
                },
                body: parsed.body,
                isSeeded: true,
                repo: `${owner}/${repo}`,
                files: relatedFiles
              };

              const idx = updatedSkills.findIndex(s => s.id === skillId);
              if (idx !== -1) {
                updatedSkills[idx] = skillObj;
              } else {
                updatedSkills.push(skillObj);
              }
              updatedAny = true;
            }
          } catch (err) {
             // Silently catch individual file fetch errors
          }
        });

        await Promise.all(skillPromises);
      } catch (repoErr) {
        console.warn(`Error scanning repo ${owner}/${repo}:`, repoErr);
      }
    });

    await Promise.all(fetchPromises);

    if (updatedAny) {
      localStorage.setItem('community_skills', JSON.stringify(updatedSkills));
    }
  } catch (err) {
    console.error('Error seeding community skills dynamically:', err);
  }
}
