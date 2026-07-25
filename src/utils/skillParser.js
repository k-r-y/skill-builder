/**
 * Utility to parse raw SKILL.md content.
 * Extracts the YAML frontmatter and the remaining markdown body.
 */
export function parseSkillMd(raw) {
  if (!raw) {
    return {
      metadata: { name: '', description: '', category: 'General', version: '1.0.0' },
      body: ''
    };
  }

  // Normalize line endings and clean up leading whitespace
  const cleanRaw = raw.trim();

  // Match YAML frontmatter block enclosed by "---" at the start
  const match = cleanRaw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  
  if (!match) {
    // If no frontmatter is found, use H1 as the name fallback and treat the whole file as body
    const h1Match = cleanRaw.match(/^#\s+(.+)$/m);
    const name = h1Match ? h1Match[1].trim() : 'Unnamed Skill';
    return {
      metadata: {
        name,
        description: '',
        category: 'General',
        version: '1.0.0'
      },
      body: cleanRaw
    };
  }

  const fmContent = match[1];
  const body = match[2].trim();
  const metadata = {
    name: '',
    description: '',
    category: 'General',
    version: '1.0.0'
  };

  let inMetadataBlock = false;

  const lines = fmContent.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Detect if we are entering a nested metadata block
    if (trimmed.startsWith('metadata:')) {
      const rest = trimmed.slice(9).trim();
      if (!rest) {
        inMetadataBlock = true;
        continue;
      }
    }

    // Indentation check: if line starts with space/tab and we are in metadata block, keep parsing nested keys
    const isIndented = line.startsWith(' ') || line.startsWith('\t');
    if (inMetadataBlock && !isIndented) {
      inMetadataBlock = false;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim().toLowerCase();
    let value = trimmed.slice(colonIndex + 1).trim();

    // Clean wrapping quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key === 'name') {
      metadata.name = value;
    } else if (key === 'description') {
      metadata.description = value;
    } else if (key === 'category') {
      metadata.category = value;
    } else if (key === 'version') {
      metadata.version = value;
    } else {
      // If we are in metadata block, store under top-level or just map
      if (inMetadataBlock) {
        if (key === 'category') metadata.category = value;
        else if (key === 'version') metadata.version = value;
      }
      metadata[key] = value;
    }
  }

  // Clean name from frontmatter or fall back to H1 header in body if name is missing
  if (!metadata.name) {
    const h1Match = body.match(/^#\s+(.+)$/m);
    metadata.name = h1Match ? h1Match[1].trim() : 'Unnamed Skill';
  }

  return { metadata, body };
}
