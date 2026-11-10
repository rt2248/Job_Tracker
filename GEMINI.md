# EVOSA / EVOLEXA CAREER STRATEGIST & JOB TRACKER
## Antigravity Project Instructions & Developer Guidelines

---

### 1. Mandatory UI/UX Design Governance: HARD RULES

> **CRITICAL DIRECTIVE FOR ALL FRONTEND AND UI/UX WORK:**  
> Before implementing **ANY** frontend UI/UX change, page redesign, visual refinement, or new component, you **MUST** consult and strictly adhere to the 13 non-negotiable principles defined in:  
> 
> 👉 **[`HARD_RULES.md`](./HARD_RULES.md)**

#### Core Enforcement Summary:
1. **Typography Must Have Presence:** Avoid tiny, muted text; ensure clear hierarchy and bold prominence for headers.
2. **Contextual Rounded Corners:** Avoid blanket large radii (`rounded-2xl` / `rounded-3xl` everywhere); use squared or subtle rounding where suitable.
3. **Avoid Identical Cards Everywhere:** Vary layout, composition, and typography; never create monotonous card grids.
4. **Avoid Empty, Meaningless Boxes:** No decorative filler containers; use purposeful whitespace and solid colors with intent.
5. **Never Clutter Information:** The user is a human being, not an AI model needing every detail explained. Keep layouts scannable.
6. **No Vague or Superficial Headings:** Eliminate marketing fluff (e.g., *"Track and manage your applications efficiently"*). Use direct, professional headings (e.g., *"Application Pipeline"*).
7. **Spacious, Deliberate Layouts:** Give sections vertical breathing room; avoid congested or compressed layouts.
8. **Avoid Boxes Inside Boxes:** Eliminate unnecessary nested cards; prefer clear section dividers and spacing.
9. **Use Existing Repository Fonts:** Utilize local fonts in `Frontend/src/assets/fonts/` (Andika, Bricolage Grotesque, JetBrains Mono, Playfair Display) and existing font tokens intentionally. Do not add external fonts.
10. **Selective Border Usage:** Use borders only to clarify structure or interaction, not around every element.
11. **Avoid Excessive Pills & Badges:** Avoid badge spam; use colored typography and whitespace where appropriate.
12. **Intentional Color & Contrast:** Maintain tasteful palette variation and verify strict contrast in both Light Mode and Dark Mode.
13. **Zero Emojis, Professional SVG Iconography Only:** Emojis are strictly prohibited throughout the UI. Use clean, accessible, theme-compatible SVG icons from `Frontend/src/assets/icons/` and maintain `Frontend/src/assets/ASSET_CATALOG.md`.

For detailed guidelines, scope, and interpretation rules, read **[`HARD_RULES.md`](./HARD_RULES.md)**.

---

### 2. Project Architecture & Assets

- **Frontend:** React + Vite + Tailwind CSS (`Frontend/`)
- **Backend:** Node.js + Express (`Backend/`)
- **Visual Assets & Icons:** Consult **[`Frontend/src/assets/ASSET_CATALOG.md`](./Frontend/src/assets/ASSET_CATALOG.md)** for approved SVG icons, brand logomarks, and typography packages. Never import heavy third-party icon libraries.
- **Theme Support:** Both Dark Mode (obsidian/slate ground) and Light Mode (crisp white/soft slate ground) must be fully supported with proper contrast.
