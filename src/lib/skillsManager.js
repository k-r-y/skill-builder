import { parseSkillMd } from '../utils/skillParser';
import fallbacks from './fallbacks.json';

const REPOS_TO_SCAN = [
  { owner: 'anthropics', repo: 'skills', branch: 'main' },
  { owner: 'LambdaTest', repo: 'agent-skills', branch: 'main' },
  { owner: 'VoltAgent', repo: 'awesome-agent-skills', branch: 'main' }
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
  
  const skillObj = {
    id: slug,
    raw: rawContent,
    metadata: parsed.metadata,
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
  if (initialSkills.length === 0) {
    for (const [skillId, raw] of Object.entries(fallbacks)) {
      if (!raw) continue;

      const parsed = parseSkillMd(raw);
      
      const fallbackMatch = COMMUNITY_SKILLS_TO_SEED.find(s => s.url.includes(skillId));
      const category = parsed.metadata.category || (fallbackMatch ? fallbackMatch.fallbackCategory : 'Community Skills');

      initialSkills.push({
        id: skillId,
        raw: raw,
        metadata: {
          ...parsed.metadata,
          category: category
        },
        body: parsed.body,
        isSeeded: true,
        files: [] // no extra files for fallback
      });
    }
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
          // e.g. path="skills/algorithmic-art/SKILL.md", dirPath="skills/algorithmic-art"
          const dirPath = skillNode.path.substring(0, skillNode.path.lastIndexOf('/'));
          // ID from the folder name
          const folderName = dirPath.split('/').pop() || 'unknown-skill';
          const skillId = folderName.toLowerCase();

          // Find other files in this directory
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
              
              // Try to find if there was a fallback category
              const fallbackMatch = COMMUNITY_SKILLS_TO_SEED.find(s => s.url.includes(folderName));
              const category = parsed.metadata.category || (fallbackMatch ? fallbackMatch.fallbackCategory : 'Community Skills');

              const skillObj = {
                id: skillId,
                raw: rawContent,
                metadata: {
                  ...parsed.metadata,
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
