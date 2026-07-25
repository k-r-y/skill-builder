import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateSkill } from './gemini';

/**
 * Creates a new cart item in 'pending' state.
 */
export function createCartItem(skill, categoryName, customNotes = '') {
  return {
    cartId: crypto.randomUUID(),
    skill,
    categoryName,
    customNotes,
    status: 'pending', // 'pending' | 'generating' | 'done' | 'error'
    generatedContent: null,
    errorMessage: null,
    addedAt: Date.now(),
  };
}

/**
 * Returns a URL-safe filename slug for a skill.
 */
export function getSkillSlug(skill) {
  return skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Runs batch generation across all pending cart items.
 * Yields updated CartItem objects as each one completes.
 * Falls back to offline mode on quota errors without stopping the batch.
 *
 * @param {CartItem[]} items
 * @param {string} apiKey
 * @param {boolean} useAI
 * @param {(updated: CartItem) => void} onItemUpdate  called after each item settles
 */
export async function batchGenerate(items, apiKey, useAI, onItemUpdate) {
  const pending = items.filter(i => i.status === 'pending');
  let quotaHit = false;

  for (const item of pending) {
    // Signal start
    onItemUpdate({ ...item, status: 'generating' });

    try {
      // If quota was hit earlier in this batch, fall back to offline for the rest
      const effectiveUseAI = useAI && !quotaHit;
      const content = await generateSkill(
        item.skill,
        item.categoryName,
        item.customNotes,
        apiKey,
        effectiveUseAI,
      );
      onItemUpdate({ ...item, status: 'done', generatedContent: content, errorMessage: null });
    } catch (err) {
      const msg = err.message || '';
      // If quota hit, fall back to offline for rest of batch
      if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('billing')) {
        quotaHit = true;
        try {
          const content = await generateSkill(item.skill, item.categoryName, item.customNotes, '', false);
          onItemUpdate({
            ...item,
            status: 'done',
            generatedContent: content,
            errorMessage: 'API quota reached — generated offline.',
          });
        } catch {
          onItemUpdate({ ...item, status: 'error', errorMessage: 'Generation failed.' });
        }
      } else {
        onItemUpdate({
          ...item,
          status: 'error',
          generatedContent: null,
          errorMessage: extractErrorMessage(msg),
        });
      }
    }
  }
}

/**
 * Creates a ZIP archive of all 'done' cart items and triggers download.
 * Each skill is placed in its own sub-directory containing SKILL.md and extra files.
 */
export async function batchDownload(items) {
  const done = items.filter(i => i.status === 'done' && i.generatedContent);
  if (!done.length) return;

  const zip = new JSZip();
  const usedNames = {};

  for (const item of done) {
    let slug = getSkillSlug(item.skill);
    // Handle duplicates
    if (usedNames[slug]) {
      usedNames[slug]++;
      slug = `${slug}-${usedNames[slug]}`;
    } else {
      usedNames[slug] = 1;
    }

    const folder = zip.folder(slug);
    folder.file('SKILL.md', item.generatedContent);

    const extraFiles = item.skill?.files || [];
    for (const file of extraFiles) {
      try {
        const res = await fetch(file.url);
        if (res.ok) {
          const fileBlob = await res.blob();
          folder.file(file.path, fileBlob);
        }
      } catch (err) {
        console.warn(`Failed to fetch file ${file.path} for batch zip`, err);
      }
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `skill-builder-export-${Date.now()}.zip`);
}

/**
 * Single skill download.
 * If the skill has additional files, it bundles them into a ZIP archive.
 */
export async function downloadSingleSkill(item) {
  if (!item.generatedContent) return;

  const extraFiles = item.skill?.files || [];
  if (extraFiles.length === 0) {
    // Single file download
    const blob = new Blob([item.generatedContent], { type: 'text/markdown' });
    saveAs(blob, `${getSkillSlug(item.skill)}.md`);
    return;
  }

  // Multi-file zip download
  const zip = new JSZip();
  const slug = getSkillSlug(item.skill);
  
  zip.file('SKILL.md', item.generatedContent);
  
  for (const file of extraFiles) {
    try {
      const res = await fetch(file.url);
      if (res.ok) {
        const fileBlob = await res.blob();
        zip.file(file.path, fileBlob);
      }
    } catch (err) {
      console.warn(`Failed to fetch file ${file.path} for zip`, err);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${slug}-package.zip`);
}

function extractErrorMessage(raw) {
  try {
    const parsed = JSON.parse(raw);
    const msg = parsed?.error?.message || raw;
    return msg.split(/\. /)[0] + '.';
  } catch {
    return raw.split(/\. /)[0] + '.';
  }
}
