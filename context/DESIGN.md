# Design System & UI/UX Guidelines - Skill Builder

## 1. Aesthetic Identity
* **Vibe:** Sleek, high-productivity developer workspace. Dark mode primary.
* **Layout Structure:** Two-column dashboard layout (NO multi-step forms or steppers).
* **Left Panel (Control Center):** Category dropdown, Skill selector, Custom Notes text area, "Generate Skill" primary button.
* **Right Panel (Playground):** Real-time editor / dynamic Markdown previewer with Copy and Download actions.

## 2. Color Palette
* **Background:** `#09090B` (Zinc 950)
* **Card/Surface:** `#18181B` (Zinc 900) with `#27272A` (Zinc 800) subtle borders.
* **Primary Brand/Accent:** `#2563EB` (Royal Blue 600) / `#3B82F6` (Blue 500)
* **Text:** `#FAFAFA` (Zinc 50 - Primary text), `#A1A1AA` (Zinc 400 - Secondary labels)
* **Theme:** Light and Dark mode

## 3. Typography
* **Primary UI Font:** Inter or system sans-serif.
* **Code / Skill Output Font:** JetBrains Mono or Fira Code for raw Markdown previews.

## 4. UI Components (shadcn/ui JavaScript variants)
* **Select / Combobox:** For Category and Skill selection.
* **Textarea:** Glassmorphic text input for extra context/notes.
* **Tabs:** To toggle between "Rendered Preview", "Edit Code", and "How to Use".
* **Button:** Accent-colored generation button with loading state spinner.