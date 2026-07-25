---
name: responsive-layouts
description: Use when a layout must adapt fluidly across mobile, tablet, and desktop screen sizes without duplicating markup.
---

# Responsive Layouts

## When to use this
> Commonly paired or confused with: css-in-js, component-architecture. See those skills if this one doesn't match the task.

Use when a layout must adapt fluidly across mobile, tablet, and desktop screen sizes without duplicating markup. This skill applies when working in the **Frontend Development** domain.

## How it works
Uses CSS media queries, Flexbox, and Grid to adapt the interface to any screen size.

**Why it matters:** Guarantees a cohesive experience across mobile, tablet, and desktop devices.

## Steps
1. Employ a mobile-first CSS approach, using min-width media queries for larger screens.
2. Use CSS Grid for complex, two-dimensional macro-layouts and Flexbox for one-dimensional micro-layouts.
3. Utilize relative units (rem, em, vh, vw) instead of fixed pixels for scalable typography and spacing.

## Never do this
- Do not rely on JavaScript window.innerWidth listeners for basic CSS styling.
- Do not create fixed-width containers that cause horizontal scrolling on small devices.
- Do not duplicate HTML nodes just to show/hide them on different screen sizes.