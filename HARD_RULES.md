# HARD RULES — PERMANENT UI/UX DESIGN PHILOSOPHY

**Project:** Evolexa Career Strategist / Job Tracker  
**Governance Scope:** All Frontend UI/UX, Pages, Components, Dialogs, and Modals  
**Priority:** CRITICAL — NON-NEGOTIABLE — MUST BE FOLLOWED IN ALL FUTURE UI/UX WORK  
**Effective Date:** Permanent Project Convention  

---

## 1. OBJECTIVE & GOVERNANCE

This document establishes the non-negotiable UI/UX design principles for **Evolexa Career Strategist / Job Tracker**.

These rules are permanent project conventions, **not** temporary suggestions or optional guidelines. They exist to prevent generic "AI slop", over-templated dashboard layouts, and visual monotony, ensuring Evolexa delivers an intentional, spacious, readable, and premium product experience.

> **MANDATORY DIRECTIVE:**  
> Before implementing **ANY** frontend UI/UX change, page redesign, visual refinement, or new component, developers and AI coding agents **MUST** consult this document and verify compliance against all 14 Hard Rules and the Interpretation Rules.

---

## 2. THE 14 HARD RULES

### HARD RULE 1 — TYPOGRAPHY MUST HAVE PRESENCE
- **Avoid tiny text** throughout the application. Supporting text must not shrink into illegibility.
- **Headings must have appropriate visual prominence.** Give headers stature and weight so page sections declare their purpose unmistakably.
- **Establish a clear hierarchy** between page titles, section headings, subheadings, and body text.
- **Avoid excessively small, thin, or muted supporting text.** Subtitles, metadata, and timestamps must remain readable at a glance without eye strain.
- **Important information must be easy to read without straining.** Numbers, metrics, key milestones, and critical labels should stand out naturally.
- **Use available typography scales consistently**, but do not make everything the same size. Rhythm requires deliberate scale contrast.
- **Give headings the prominence they deserve.**

---

### HARD RULE 2 — ROUNDED CORNERS MUST BE CONTEXTUAL
- **Do not use rounded corners on everything.**
- **Avoid automatically applying large border radii** (e.g., blanket `rounded-2xl` or `rounded-3xl`) to every card, container, button, tag, and section.
- **Use rounded corners where they make contextual design sense** (e.g., interactive chips, pills, discrete buttons, specific floating surfaces).
- **Use appropriately squared or subtly rounded elements** (`rounded-none`, `rounded-sm`, `rounded-md`) where structural stability, dense information, tabular layouts, or visual weight is more suitable.
- **Do not confuse excessive rounding with modern design.**

---

### HARD RULE 3 — AVOID IDENTICAL CARDS EVERYWHERE
- **Do not represent every piece of information using an identical card.**
- **Avoid monotonous grids** of visually identical containers that blur together and fatigue the user.
- **Introduce appropriate variation** through layout composition, typography scale, horizontal/vertical rhythm, open sections, and visual hierarchy.
- **Use cards only when they genuinely improve content organization** and grouping.
- **Different types of information should not automatically receive identical visual treatment.** A metric callout, a quick action, an application timeline, and a key insight require differentiated presentations.

---

### HARD RULE 4 — AVOID EMPTY, MEANINGLESS BOXES
- **Do not introduce blank decorative cards or containers.**
- **Avoid creating boxes that consume space** without communicating meaningful, actionable information.
- **Use solid and appropriately selected colors** for sections, surfaces, and important information where they improve visual appeal and structural comprehension.
- **Colored surfaces must have a clear design purpose.**
- **Do not introduce decorative containers simply to make the page look fuller.** Whitespace is vastly superior to filler frames.

---

### HARD RULE 5 — NEVER CLUTTER INFORMATION
- **Users should not have to process huge amounts of information in a small space.**
- **Avoid excessive descriptions, instructions, metadata, and explanatory paragraphs.**
- **Display only information that is useful in the current context.**
- **Prioritize important information** and ruthlessly remove unnecessary repetition.
- **Use whitespace and appropriate typography** to make content digestible and scannable.
- **Do not overwhelm users with information they do not need.**

> **Core Principle:**  
> **The user is a human being, not an AI model that needs every detail explained.**

---

### HARD RULE 6 — NO VAGUE OR SUPERFICIAL HEADINGS
- **Avoid generic marketing-style headings and descriptions** inside application pages.
  
  **Headings to AVOID:**
  - ❌ *"Track and manage your applications efficiently."*
  - ❌ *"Your journey to career success starts here."*
  - ❌ *"Take control of your professional future."*
  - ❌ *"Your personalized career management experience."*

- If the user is already inside the Dashboard, Profile, Applications, or Insights page, **the page context is established**.
- **Do not waste space explaining what the page is supposed to do.**
- **Use direct, meaningful, and professional headings:**
  - ✅ *"Application Pipeline"*
  - ✅ *"Upcoming Interviews"*
  - ✅ *"Professional Information"*
  - ✅ *"Profile Completeness"*
  - ✅ *"Account Security"*
  - ✅ *"Skill Fit Analysis"*
  - ✅ *"Offer Distribution"*

- **Avoid marketing language, artificial enthusiasm, and generic AI-generated descriptions.**

---

### HARD RULE 7 — PAGES MUST NOT FEEL SMALL OR CONGESTED
- **Use sufficient whitespace.** Sections need space to breathe.
- **Give sections appropriate vertical breathing room** (`py-8`, `py-10`, `gap-8`, etc.) rather than cramming components edge-to-edge.
- **Avoid compressing large amounts of information into small containers.**
- **Use appropriate typography and spacing to establish visual hierarchy.**
- **Ensure pages feel spacious, readable, and deliberately composed.**
- **Do not confuse information density with good information design.** Dense without hierarchy is noise; spacious with clear focal points is clarity.

---

### HARD RULE 8 — AVOID BOXES INSIDE BOXES
- **Do not unnecessarily nest cards and containers.**
- **Avoid putting several independent cards inside another card container.**
- **When multiple sections belong together, use horizontal or vertical separators** (`border-t`, `divide-y`, background shifts) where appropriate.
- **Prefer clear section divisions over excessive container nesting.**
- **Use nested containers only when there is a genuine structural or functional reason** (e.g., an expandable sub-row or an isolated modal input group).

---

### HARD RULE 9 — USE THE FONTS ALREADY AVAILABLE IN THE REPOSITORY
- **Inspect the fonts available in the project before introducing or changing typography.**
  - Evolexa maintains verified local font packages in `Frontend/src/assets/fonts/`:
    - **Andika** (`Frontend/src/assets/fonts/Andika/`): Clean, accessible, friendly sans-serif
    - **Bricolage Grotesque** (`Frontend/src/assets/fonts/Bricolage_Grotesque/`): Expressive, distinctive, high-personality grotesque display
    - **JetBrains Mono** (`Frontend/src/assets/fonts/JetBrains_Mono/`): Code, technical identifiers, data telemetry, state tags
    - **Playfair Display** (`Frontend/src/assets/fonts/Playfair_Display/`): Editorial serif with refined presence
  - Global CSS imports also supply configured system sans (`Geist Variable`, `Inter`, `Outfit`).
- **Use the existing font families intentionally.** Explore appropriate combinations for headings, body text, and supporting information.
- **Do not default to using one font everywhere** without considering the available alternatives and designated roles.
- **Maintain readability and consistency.**
- **Do not download new fonts unnecessarily.**
- **Preserve existing font assets and licensing requirements.**
- **Typography should contribute to Evolexa's visual identity** rather than make it look like a generic template.

---

### HARD RULE 10 — BORDERS MUST BE USED SELECTIVELY
- **Do not put borders around every section.**
- **Use borders when they clarify structure, separation, or interaction** (e.g., active focus states, subtle table dividers).
- **Allow sections to exist without borders** when spacing, background variation, or typography already establishes separation.
- **Avoid unnecessary nested borders.**
- **Preserve the established theme-specific border treatments** (`--border-primary`, `--border-subtle`, `--border-accent`).
- **Do not make every component look like a bordered rectangle.**

---

### HARD RULE 11 — AVOID EXCESSIVE COLORED PILLS AND BADGES
- **Do not use colored pills for every status, label, category, or piece of metadata.**
- **Use larger colored text where it communicates information more naturally.**
- **Reserve badges for situations where compact status indicators are genuinely useful** (e.g., application pipeline state: Applied, Interview, Offer, Rejected).
- **Use semantic colors intentionally** (`--status-wishlist`, `--status-applied`, `--status-interview`, `--status-offer`, `--status-rejected`).
- **Avoid repeating the same information** through both a colored badge and nearby text.
- **Colored typography can often communicate status more elegantly** than another pill-shaped container.

---

### HARD RULE 12 — USE COLOR WITH INTENTION AND VARIETY
- **Do not use the same color treatment everywhere.**
- **Use the existing project palette thoughtfully** (`canvas`, `surface-primary`, `surface-secondary`, `surface-elevated`, `indigo`, `cyan`, `ink`, semantic status tokens).
- **Introduce appropriate color variation** across headings, sections, surfaces, boxes, and buttons.
- **Give important sections meaningful visual distinction.**
- **Use semantic colors consistently.**
- **Ensure sufficient contrast in both Light Mode and Dark Mode.** In Light Mode, verify text and primary buttons maintain high contrast (e.g., crisp white `#ffffff` on primary blue/indigo, dark charcoal on canvas).
- **Avoid arbitrary colors and excessive gradients.**
- **Do not make every section monochromatic** when the design context supports tasteful variation.

---

### HARD RULE 13 — NEVER USE EMOJIS ANYWHERE IN THE APPLICATION

Emojis are strictly prohibited throughout the entire Evolexa application UI.

This applies without exception to:
- **Sidebar navigation.**
- **Navbar and header.**
- **Buttons and action controls.**
- **Page headings and section headings.**
- **Cards and dashboard metrics.**
- **Status indicators.**
- **Empty states.**
- **Notifications and alerts.**
- **Forms and input labels.**
- **Dropdowns and menus.**
- **Tooltips.**
- **Charts and legends.**
- **Modals and dialogs.**
- **Loading states.**
- **All other application components.**

#### Required Alternative: Professional SVG Icons

Use clean, professional, consistent SVG icons instead of emojis.

Follow these requirements:
1. **First inspect existing icon assets** and [`Frontend/src/assets/ASSET_CATALOG.md`](./Frontend/src/assets/ASSET_CATALOG.md).
2. **Reuse existing suitable SVG icons** wherever possible.
3. **When a required icon does not exist**, create or source an appropriate SVG icon.
4. **Save reusable SVG icon assets** in the established directory:
   `Frontend/src/assets/icons/`
5. **Update [`ASSET_CATALOG.md`](./Frontend/src/assets/ASSET_CATALOG.md)** whenever new reusable SVG assets are introduced.
6. **Follow existing icon naming conventions** and folder organization (`navigation/`, `actions/`, `status/`, `analytics/`, `applications/`, `social/`, `miscellaneous/`).
7. **Maintain consistent visual style:** Ensure stroke weight, proportions, visual style, and sizing are harmonious with the application design system.
8. **Theme compatibility:** Icons must work correctly in both Light Mode and Dark Mode (use `currentColor` or semantic theme tokens).
9. **Use appropriate CSS or SVG styling** for theme compatibility.
10. **Ensure accessible labels:** Provide accessible labels (`aria-label`, `aria-hidden="true"`, or associated label text) or appropriate accessibility attributes.

#### Additional Restrictions
- **Do not replace emojis with Unicode symbols or decorative text characters.**
- **Do not use random icon styles** from unrelated libraries.
- **Do not introduce unnecessary icon dependencies.**
- **Do not create multiple SVGs** for icons that already exist in the asset library.
- **Do not use SVGs containing unsafe scripts**, event handlers, or external executable content.
- **Do not use decorative icons where no icon is necessary.**

#### Enforcement
This rule applies to all existing and future application pages and components.

During every future UI/UX audit:
- Identify existing emojis.
- Replace them with suitable professional SVG icons.
- Verify that no emojis remain in the application UI.
- Update the asset catalog where necessary.

> **Important:** This is a permanent design governance rule, not an instruction to immediately redesign the entire application.

---

### HARD RULE 14 — VISUAL DEPTH, SURFACE IDENTITY & COMPONENT PRESENCE

**Never create visually flat, lifeless containers.** Every major UI block must have a deliberate visual identity and sufficient depth to feel like a distinct, tangible part of the interface.

- **Surface Definition:** Containers must have a clearly defined visual surface, distinguishable from the page background. Use intentional background treatments, surface contrast, and appropriate edge definition.
- **Visual Depth:** Use contextual elevation, subtle shadows, layered surfaces, tonal contrast, and other appropriate techniques to give components visual weight and presence.
- **Component Identity:** Major sections and components should not all look like identical rectangles. Give them distinct visual characteristics appropriate to their purpose and content.
- **Surface Hierarchy:** Establish meaningful differences between the application background, primary containers, secondary surfaces, interactive elements, and nested content.
- **Intentional Treatment:** Choose visual treatments based on component importance and function. Not every container needs a shadow, raised surface, or colored background.
- **Avoid Artificial Decoration:** Do not compensate for flatness with excessive gradients, glowing effects, ornamental borders, or unnecessary visual effects.
- **Theme Consistency:** Apply intentional depth and surface differentiation in both Light and Dark themes. Do not assume that simply changing background colors creates sufficient visual identity.

**Core Principle:** Every major UI block should feel designed, defined, and visually present—not like content trapped inside a flat box. Use depth and surface identity to create a visually rich, cohesive application without sacrificing readability or usability.

---

## 3. SCOPE OF APPLICATION

These 14 Hard Rules apply across all frontend surfaces:

1. **Dashboard** (`Dashboard.jsx`, Kanban board, metric sections, upcoming actions)
2. **Search Jobs** (`JobSearch.jsx`, search bars, filter popovers, job listings, detail modals)
3. **Application Pipeline** (`Applications.jsx`, Kanban cards, table view, stage transitions)
4. **Insights & Analytics** (`Insights.jsx`, charts, telemetry cards, activity graphs)
5. **Network** (`Network.jsx`, contact nodes, outreach logs, connection cards)
6. **Profile & Account** (`Profile.jsx`, overview, edit tabs, resume sections, security settings, completeness)
7. **All Other Application Pages** (Career Strategist, Auth flows, settings, etc.)
8. **Shared Components** (`Button.jsx`, `Card.jsx`, inputs, selects, dropdowns, headers, sidebar)
9. **Modals, Dialogs, Drawers & Forms**
10. **All Responsive Layouts** (Mobile, Tablet, Desktop)
11. **All Supported Themes** (Dark Mode & Light Mode)

---

## 4. IMPORTANT INTERPRETATION RULES

When applying these rules, every engineer and AI agent must adhere to these interpretation boundaries:

1. **Contextual Design Principles, Not Blind Removal:**  
   These are design principles, not instructions to blindly delete every card, border, badge, or rounded corner. Evaluate what serves the user in context.
2. **Every Decision Must Be Contextual:**  
   Adapt styling to the user's workflow needs and the density requirements of the specific tool.
3. **Preserve Existing Functionality:**  
   Existing functionality, business logic, form handling, and state machines must always be preserved unless explicitly authorized otherwise by the user.
4. **Never Invent Decorative Clutter:**  
   Never invent new components, decorative illustrations, or visual filler merely to satisfy these rules.
5. **Do Not Independently Redesign Unrelated Sections:**  
   Stay focused on the requested scope. Do not cascade unsolicited redesigns across untouched files.
6. **True Premium vs. Gimmicks:**  
   Do not interpret "premium" as adding arbitrary gradients, glowing shadows, floating decorative icons, or excessive animation. True quality is achieved through restraint, proportion, typography, and clear hierarchy.
7. **Respect Explicit Visual References:**  
   When a task specifies an existing page, component, or mockup as a visual reference, respect that reference.
8. **Precedence in Conflict:**  
   When instructions conflict, follow the user's explicit task-specific directions while preserving these 14 Hard Rules wherever possible.

---

## 5. DEVELOPER & AGENT PRE-FLIGHT CHECKLIST

Before submitting or committing frontend changes, verify:

- [ ] **Typography:** Are headings prominent? Is body/supporting text legible without eye strain?
- [ ] **Headings:** Are page headings direct and functional, free from marketing fluff or AI commentary?
- [ ] **Cards & Layout:** Did we avoid repeating identical card shapes? Did we avoid nesting boxes inside boxes?
- [ ] **Information Density:** Is the content digestible and uncluttered? Did we avoid walls of explanatory text?
- [ ] **Spacing:** Does the page feel spacious, with breathing room between major sections?
- [ ] **Borders & Radii:** Are rounded corners and borders applied selectively rather than universally?
- [ ] **Badges & Pills:** Did we avoid pill spam? Can color or typography communicate status cleanly instead?
- [ ] **Fonts & Tokens:** Did we use existing fonts and theme tokens without downloading third-party bloat?
- [ ] **Themes:** Does the layout look crisp, legible, and high-contrast in both Dark and Light modes?
- [ ] **Iconography & Emojis (Hard Rule 13):** Are emojis 100% absent from the UI? Are professional, theme-compatible SVGs used where icons are needed, without decorative icon clutter?
- [ ] **Visual Depth & Surface Identity (Hard Rule 14):** Do major containers exhibit clear surface differentiation, contextual elevation, and tangible component presence without artificial gradients or flat boxy uniformity in both Dark and Light modes?
