<div align="center">

# ⚡ Skill Builder

**Generate production-grade AI agent skill files in seconds.**  
A no-login, offline-first tool for developers who want tailored, structured `.md` skills — not generic templates.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000?style=for-the-badge&logo=vercel)](https://your-app.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## What is this?

Skill Builder is a single-view web app that converts a software engineering concept into a valid, machine-loadable **SKILL.md** file — the kind used by AI agent runtimes (Cursor rules, system prompts, `.agents/skills/` directories).

Select a domain, pick one of **100 curated skills** across **10 engineering categories**, optionally add project-specific constraints, and get a structured skill file with proper YAML frontmatter, ordered steps, and anti-patterns — instantly, with no account required.

### v2 adds a Skill Queue
Build a batch of skills, preview and edit each one individually, then download the entire set as a single ZIP archive.

---

## Features

| Feature | Description |
|---|---|
| **100 Skills × 10 Categories** | UI/UX, Frontend, Mobile, Backend, Database, Cloud, QA, Security, DevOps, AI/ML |
| **Offline-first generation** | Fully structured output with no API key — assembled from a curated JSON schema |
| **AI mode** | Optional Gemini API integration for dynamic, synthesized content |
| **Skill Queue (v2)** | Add multiple skills to a queue, manage, preview, edit, and batch generate |
| **Batch download** | Export all generated skills as a `.zip` archive (one `.md` per skill) |
| **YAML frontmatter** | Output starts with `---` — valid for agent runtimes, not just formatted docs |
| **Light & Dark mode** | Persisted theme preference |
| **No auth, no database** | `localStorage` only — nothing leaves your browser unless you explicitly copy/download |

---

## Screenshots

> _Add screenshots here after deploying._

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/skill-builder.git
cd skill-builder

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## Usage

### Offline mode (default — no API key needed)

1. Select a **Category** from the left panel dropdown
2. Select a **Skill** from the filtered list
3. Optionally add **Custom Constraints** (project rules, tech stack, edge cases)
4. Click **Generate Skill** → the Preview tab renders a fully structured SKILL.md
5. Copy or Download the output

### AI mode

1. Toggle **Offline → AI** in the top-right header
2. Paste a **Gemini API Key** into the input that appears
3. Generate as normal — the LLM synthesizes content dynamically from your schema and notes

> **Note:** The Gemini free tier allows ~20 requests/day. If quota is hit mid-batch, the app automatically falls back to offline generation for remaining skills.

### Skill Queue (v2)

1. Configure a skill and click **Add to Queue** instead of Generate
2. Switch to the **Queue tab** in the right panel
3. Per-item actions: **Preview (👁)**, **Edit constraints (✏)**, **Remove (🗑)**
4. Click **Generate All** to batch-generate all pending items
5. Click **Download ZIP** to export all completed skills

---

## Project Structure

```
skill-builder/
├── src/
│   ├── components/
│   │   ├── CartPanel.jsx          # Queue tab — list of cart items
│   │   ├── EditItemModal.jsx      # Edit constraints for a cart item
│   │   ├── SkillPreviewModal.jsx  # Full-screen preview modal
│   │   └── ui/                   # shadcn/ui primitives (Button, Card, etc.)
│   ├── data/
│   │   └── skillsMatrix.json     # 100 skills × 10 categories + full schema
│   ├── lib/
│   │   ├── cart.js               # Cart logic, batch generate, ZIP download
│   │   ├── gemini.js             # Gemini API client + offline builder
│   │   └── storage.js            # localStorage helpers
│   ├── App.jsx                   # Root component and state
│   └── index.css                 # Global styles, Tailwind layers, animations
├── context/                      # Project documentation (PRD, schema, etc.)
├── public/                       # Static assets
├── index.html
├── vite.config.js
└── tailwind.config.js
```

---

## Skill Schema

Each skill in `skillsMatrix.json` follows this shape:

```json
{
  "id": "client-side-routing",
  "categoryId": "frontend-development",
  "name": "Client-Side Routing",
  "trigger": "Use when implementing or modifying in-app navigation in a single-page application.",
  "howItWorks": "...",
  "whyItMatters": "...",
  "directives": ["...", "...", "..."],
  "antiPatterns": ["...", "...", "..."],
  "relatedSkills": ["server-side-rendering", "global-state-management"],
  "scope": {
    "requiresConfirmation": []
  }
}
```

The `trigger` field becomes the SKILL.md frontmatter `description`. The `directives` become the ordered **Steps** list. The `scope.requiresConfirmation` array, when non-empty, produces a **"Requires human confirmation before"** section.

---

## Output Format

Every generated file is a valid agent skill:

```markdown
---
name: client-side-routing
description: Use when implementing or modifying in-app navigation in a single-page application.
---

# Client-Side Routing

## When to use this
...

## How it works
...

## Steps
1. ...
2. ...

## Never do this
- ...

## Requires human confirmation before       ← only if scope.requiresConfirmation is non-empty
- ...

## Project-specific constraints             ← only if the user typed custom notes
- ...
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 8 |
| Language | JavaScript (no TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| AI | `@google/genai` (Gemini 2.x) |
| Archive | JSZip + file-saver |
| Icons | Lucide React |
| Persistence | `localStorage` |

---

## Deploying to Vercel

```bash
# Push to GitHub first
git add .
git commit -m "feat: ready for deploy"
git push origin main
```

Then in [vercel.com](https://vercel.com):
1. **New Project** → Import from GitHub
2. Framework preset will auto-detect **Vite**
3. No environment variables needed (API keys are entered by users at runtime)
4. Click **Deploy**

Build settings (auto-detected, but confirming):

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

---

## Development Notes

- **No TypeScript** — by design. All files are `.js` / `.jsx`.
- **No Redux** — state is managed with `useState` + `localStorage`.
- **No auth** — the app is fully client-side with no backend.
- API keys entered by the user are stored only in `localStorage` and never sent anywhere except directly to the Gemini API from the browser.

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes (`git commit -m 'feat: add something'`)
4. Push to the branch (`git push origin feat/your-feature`)
5. Open a Pull Request

---

## License

MIT © 2026 — see [LICENSE](LICENSE) for details.
