# System Architecture - Skill Builder

## 1. Top-Level Overview
* **Framework:** React 18 running on Vite.
* **Language:** Pure JavaScript (`.js` / `.jsx`).
* **Styling & UI:** Tailwind CSS + shadcn/ui JavaScript components.
* **AI Service Layer:** Client-side integration with an LLM API (e.g., OpenAI API / Google Gemini API / Anthropic API) or lightweight serverless function to execute dynamic prompt generation.

## 2. Core Architecture Patterns
* **Single-Page Application (SPA):** Everything operates inside a unified dashboard view—no stepper routes or multi-page navigation.
* **Client-First Execution:** Embedded static dataset of 100 Master Skills loaded directly into memory for instantaneous UI updates.
* **Un-Templated Synthesis Pattern:** Instead of string interpolation templates, user choices (Category + Skill Mechanics + Custom Notes) are passed into a system prompt that dynamically synthesizes unique skill files from scratch.

## 3. Data Flow
1. **Selection:** User picks 1 Category -> Application filters the static JSON dataset for the matching 10 skills.
2. **Configuration:** User selects 1 Skill (or inputs a custom name) and types extra contextual notes.
3. **Dispatch:** Frontend constructs an instruction payload merging the skill's mechanical breakdown with the user's custom notes.
4. **Generation:** AI service returns the generated Markdown payload containing the instruction set and "How to Use" section.
5. **Preview & Edit:** React state receives the Markdown stream; user edits live in the playground and copies/downloads the final `.md` file.