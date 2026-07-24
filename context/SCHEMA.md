# Data Models & Client Storage - Skill Builder

*Note: Since no backend database or login is required, state is managed entirely in-memory and persisted via client-side `localStorage`.*

## 1. Static Data Structure (`skills_matrix.json`)

### `Category`
```json
{
  "id": "frontend-development",
  "name": "Frontend Development",
  "description": "Client-side architecture, performance, and UI logic."
}

{
  "id": "global-state-management",
  "categoryId": "frontend-development",
  "name": "Global State Management",
  "howItWorks": "Centralizes application data into a single store accessible by any component.",
  "whyItMatters": "Eliminates prop-drilling and manual data synchronization across nested UI components."
}

{
  "selectedCategoryId": "frontend-development",
  "selectedSkillId": "global-state-management",
  "customSkillName": "",
  "customNotes": "Must use Zustand for React with TypeScript-like JSDoc comments.",
  "isGenerating": false
}

{
  "id": "skill_1720000000000",
  "skillName": "Global State Management",
  "category": "Frontend Development",
  "contentMarkdown": "# SKILL: Global State Management\n\n## Overview...",
  "howToUse": "Copy this file into your project under `.cursor/rules/` or pass to your AI agent.",
  "createdAt": "2026-07-24T13:00:00.000Z"
}```