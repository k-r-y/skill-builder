<div align="center">

# ⚡ Skill Builder v2

**Generate & package production-grade AI agent skill files instantly.**  
A no-login, offline-first tool for developers to generate, customize, and package structured `.md` and multi-file agent skills.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000?style=for-the-badge&logo=vercel)](https://kry-skill-builder.vercel.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## What is Skill Builder?

**Skill Builder v2** is a single-view web application that generates, customizes, and packages machine-loadable **SKILL.md** files and multi-file skill folders for AI agent runtimes (Claude, Antigravity SDK, Cursor rules, `.agents/skills/` directories).

Browse or search across **130 curated skills** organized into **10 domain categories**. Add project-specific constraints, preview markdown output in real time, and export single or queued skills as complete ZIP packages with all supporting scripts and resources preserved.

---

## What's New in v2 ✨

* **ReactBits Spotlight Search (`⌘K`)**: A macOS Spotlight-style global search modal featuring dark glassmorphism, backdrop blur, keyboard navigation (`⌘K` to open, `Escape` to close), and instant filtering.
* **Generation Engine Settings Modal**: Switch between **System Default Mode (Offline)** for instant, zero-latency template generation and **AI Generated Mode (Gemini AI)** for dynamic LLM synthesis.
* **Complete ZIP Package Export**: Single and batch downloads export a root skill directory (e.g. `webapp-testing/`) containing `SKILL.md` and all supporting files (`+N` scripts, references, templates) in their exact relative subpaths.
* **Responsive Multi-Line Typography**: Word wrapping (`break-words overflow-wrap: anywhere`) ensures skill previews, metadata, and code snippets render without horizontal cut-offs.
* **Performance & SEO Optimizations**: Built with Vite 8 vendor chunk splitting (`vendor-react`, `vendor-icons`, `vendor-markdown`, `vendor-utils`), font preloading, OpenGraph metadata, and HTML5 semantic landmarks.

---

## Features

| Feature | Description |
|---|---|
| **130 Skills × 10 Categories** | AI Agents, UI/UX, Frontend, Mobile, Backend, Database, Cloud & Infrastructure, QA, Security, Science |
| **Spotlight Search (`⌘K`)** | ReactBits-style global modal for searching skills across all categories instantly |
| **Engine Settings** | Choose between **System Default (Offline)** or **AI Generated (Gemini AI)** mode |
| **ZIP Package Download** | Export skills as `.zip` packages with `<skill-name>/SKILL.md` and supporting file subpaths |
| **Skill Queue & Batch Generation** | Queue multiple skills, edit custom constraints per item, and batch-export as ZIP |
| **YAML Frontmatter** | Generates valid `---` frontmatter for agent runtimes and CLI tools |
| **Responsive Dark & Light Mode** | Styled with glassmorphic cards and dark/light mode toggles |
| **Client-side & Privacy First** | `localStorage` persistence — API keys and notes stay strictly in your browser |

---

## Skill Categories

1. **AI Agents & Vibe Coding**: `claude-api`, `google-antigravity-sdk`, `mcp-builder`, `skill-creator`, `workflow-skill-creator`
2. **UI/UX, Web Design & Visual Identity**: `brand-guidelines`, `theme-factory`, `frontend-design`, `web-design-guidelines`, `canvas-design`, `algorithmic-art`, `slack-gif-creator`, `responsive-layouts`, `web-artifacts-builder`
3. **Full-Stack Infrastructure & Deployment**: `firebase-auth-basics`, `firebase-firestore`, `firebase-data-connect`, `firebase-crashlytics`, `firebase-app-hosting-basics`, `firebase-hosting-basics`, `firebase-remote-config-basics`, `firebase-security-rules-auditor`, `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize`
4. **React & Next.js Ecosystem**: `vercel-react-best-practices`, `vercel-composition-patterns`, `vercel-react-view-transitions`, `vercel-react-native-skills`
5. **Browser Automation & Extensions**: `chrome-devtools`, `a11y-debugging`, `debug-optimize-lcp`, `memory-leak-debugging`, `troubleshooting`, `chrome-extensions`, `modern-web-guidance`
6. **QA, Testing & Mobile**: `webapp-testing`, `android-cli`, `xcode-project-setup`
7. **Administration, Comms & Documentation**: `doc-coauthoring`, `internal-comms`, `writing-guidelines`, `docx`, `xlsx`, `pdf`, `pptx`
8. **Bioinformatics & Scientific Computing**: `alphafold-database-fetch-and-analyze`, `alphagenome-single-variant-analysis`, `chembl-database`, `clinical-trials-database`, `clinvar-database`, `dbsnp-database`, `embl-ebi-ols`, `encode-ccres-database`, `ensembl-database`, `foldseek-structural-search`, `gnomad-database`, `gtex-database`, `human-protein-atlas-database`, `interpro-database`, `jaspar-database`, `ncbi-sequence-fetch`, `openfda-database`, `opentargets-database`, `pdb-database`, `protein-sequence-msa`, `protein-sequence-similarity-search`, `pubchem-database`, `pubmed-database`, `pymol`, `quickgo-database`, `reactome-database`, `string-database`, `ucsc-conservation-and-tfbs`, `unibind-database`, `uniprot-database`
9. **Literature & Scholarly Search**: `literature-search-arxiv`, `literature-search-biorxiv`, `literature-search-europepmc`, `literature-search-openalex`
10. **Environment & Package Management**: `uv`, `firebase-basics`

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/k-r-y/skill-builder.git
cd skill-builder

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The application runs at `http://localhost:5173` by default.

---

## Usage

### 1. Offline Mode (System Default)

1. Press **`⌘K`** to search any skill or choose a category from the dropdown.
2. Select a skill concept.
3. Optionally enter **Custom Constraints** (tech stack, project rules).
4. Click **Generate Skill** to preview the rendered `SKILL.md`.
5. Click **Download** to receive `<skill-name>.zip` containing `<skill-name>/SKILL.md` and any supporting files.

### 2. AI Mode (Gemini AI Engine)

1. Click **Settings** in the top navigation bar.
2. Select **AI Generated Mode (Gemini AI)**.
3. Paste a **Google Gemini API Key**.
4. Save settings and generate dynamically synthesized skills.

### 3. Skill Queue & Batch ZIP Export

1. Configure skills and click **Add to Queue**.
2. Open the **Queue** tab in the right panel to preview, edit constraints, or remove items.
3. Click **Generate All** to synthesize all queued skills.
4. Click **Download ZIP** to export all completed skills into a single structured ZIP archive.

---

## Project Structure

```
skill-builder/
├── src/
│   ├── components/
│   │   ├── BorderGlow.jsx         # Micro-interaction glowing card boundary
│   │   ├── CartPanel.jsx          # Queue panel for batch operations
│   │   ├── EditItemModal.jsx      # Modal for updating queue item constraints
│   │   ├── SearchSelect.jsx       # Category search select dropdown
│   │   ├── SkillPreviewModal.jsx  # Full-screen markdown preview modal
│   │   └── ui/                   # shadcn/ui primitives (Button, Card, Tabs, etc.)
│   ├── lib/
│   │   ├── cart.js               # Queue logic, batch generation & ZIP download
│   │   ├── gemini.js             # Gemini API client & offline skill fallback builder
│   │   ├── skillsManager.js      # Skill loader, repository scanner & local storage
│   │   └── storage.js            # State persistence helpers
│   ├── utils/
│   │   └── skillParser.js        # Frontmatter & markdown section parser
│   ├── App.jsx                   # Root application state & Spotlight modal
│   └── index.css                 # Global CSS design tokens, markdown styles & animations
├── index.html                    # SEO meta tags, resource preloads & JSON-LD
├── vite.config.js                # Vite 8 config with vendor chunk splitting
└── package.json
```

---

## Output Package Format

Downloaded skill ZIP packages follow standard agent skill guidelines:

```
webapp-testing.zip
└── webapp-testing/
    ├── SKILL.md
    ├── scripts/
    │   └── test_runner.py
    └── references/
        └── best_practices.md
```

### `SKILL.md` Structure

```markdown
---
name: webapp-testing
description: Guidance for testing web applications using Playwright.
category: QA, Testing & Mobile
version: 1.0.0
---

# Web App Testing

## Overview
...

## Prerequisites
1. ...

## Key Concepts
- ...
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **Styling** | Tailwind CSS + shadcn/ui + Lucide Icons |
| **AI Integration** | `@google/genai` (Google Gemini API) |
| **Archive Packaging** | JSZip + file-saver |
| **Markdown Rendering** | react-markdown |
| **Build Optimizer** | Rolldown / Rollup vendor chunk splitting |

---

## License

MIT © 2026 — see [LICENSE](LICENSE) for details.
