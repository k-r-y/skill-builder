# Coding Standards & Implementation Rules - Skill Builder

## 1. Strict Language & Framework Constraints
* **JavaScript ONLY:** ALL code files MUST be written in standard JavaScript (`.js`, `.jsx`). **ABSOLUTELY NO TYPESCRIPT (`.ts`, `.tsx`) IS ALLOWED.**
* **Framework:** React with Vite.
* **Styling:** Tailwind CSS + shadcn/ui (JavaScript imports).

## 2. Architecture & Form Rules
* **NO Stepper Forms:** The UI must display Category selection, Skill selection, and Notes input simultaneously on a single screen.
* **No Authentication:** Do not add authentication, route guards, or login prompts.
* **Zero Rigid Templates:** AI calls must produce custom, synthesized output based on mechanics and notes rather than statically filling in placeholders.

## 3. Code Quality & Principles
* **SOLID Principles:** Keep UI component rendering separate from API calls and dataset lookups.
* **DRY (4x Rule):** If a UI pattern (e.g., card header, icon button) is repeated 4 times or more, extract it into a reusable `.jsx` component.
* **KISS:** Avoid complex state managers like Redux for MVP. Standard React hooks (`useState`, `useContext`) and `localStorage` are sufficient.

## 4. File Naming Conventions
* **React Components:** `PascalCase.jsx` (e.g., `SkillSelector.jsx`, `SkillPreview.jsx`).
* **Utility Scripts / Data:** `camelCase.js` or `snake_case.json` (e.g., `skillsMatrix.json`, `aiGenerator.js`).