# Product Requirements Document (PRD) - Skill Builder

## 1. Project Overview
* **Name:** Skill Builder
* **Objective:** A lightweight, no-login web application that allows developers to create, customize, and generate production-grade, un-templated AI skill context files.
* **Target Audience:** Developers, prompt engineers, and "vibe coders" who want custom, highly tailored AI skills with full ownership and clarity on how to execute them.

## 2. Problem & Solution
* **Problem:** Standard AI community skills are rigid, untrusted, or lack clarity on execution. Many developers don't know what skills exist or how to craft them effectively.
* **Solution:** An instant, single-view builder where users select from 100 core software engineering skills (or enter a custom one), attach specific project notes, and dynamically generate a unique, ready-to-use AI skill file with usage instructions.

## 3. Goals & Success Metrics
* **No Authentication Friction:** 100% usable without account creation or login.
* **Zero Steppers:** Single-view interface (Pick 1 Category -> Pick 1 Skill -> Add Notes -> Generate).
* **Zero Rigid Templates:** Every skill generation uses dynamic AI synthesis to guarantee non-generic, custom outputs.
* **Speed:** From selection to copied skill file in < 15 seconds.

## 4. Key Features (MVP)
1. **Master Skill Matrix Explorer (100 Skills Across 10 Categories):**
   * UI/UX Design, Frontend, Mobile, Backend, Database, Cloud, QA/Testing, Cybersecurity, DevOps/Architecture, AI/ML.
2. **Single-View Control Panel:**
   * Dynamic dropdown/selector for Category.
   * Contextual skill loader based on selected Category + Custom Skill option.
   * Free-form text input for extra context, constraints, or custom notes.
3. **Dynamic AI Skill Generator:**
   * Generates a complete skill file containing: Mechanical Breakdown, System Prompt Instructions, Edge-Case Safeguards, and "How to Use" guide.
4. **Interactive Skill Playground:**
   * Markdown preview with tabbed raw/rendered view.
   * Live inline text editing before saving.
   * One-click "Copy Skill" and "Download `.md`".

## 5. Technical & Constraint Requirements
* **Tech Stack:** React (Vite), JavaScript (NO TypeScript), Tailwind CSS, shadcn/ui (JS components).
* **Storage:** `localStorage` only (no remote database required for MVP).