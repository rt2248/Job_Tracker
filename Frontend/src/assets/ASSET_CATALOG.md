# Evolexa Visual Asset Catalog & Developer Registry

**Project:** Evolexa Career Strategist / Job Tracker  
**Location:** `Frontend/src/assets/ASSET_CATALOG.md`  
**Last Updated:** November 2026  
**Status:** Active & Enforced  

---

## 1. Overview & Directory Architecture

To prevent asset duplication, fragmented visual imports, and security vulnerabilities across Evolexa, all static visual assets are organized in a centralized hierarchy under `Frontend/src/assets/`. Standalone icons and logos are separated into semantic, kebab-case subdirectories.

```text
Frontend/src/assets/
├── icons/
│   ├── navigation/        # Page navigation, sidebar, back controls
│   ├── actions/           # Interactive controls (visibility, logout, search)
│   ├── status/            # System states, notifications, alerts
│   ├── analytics/         # Data, telemetry, and analytics iconography
│   ├── applications/      # Job application domain & module icons
│   ├── social/            # Social network icons (GitHub, LinkedIn, Twitter)
│   └── miscellaneous/     # User profile, avatars, generic iconography
│
├── logos/
│   ├── brand/             # Evolexa identity marks and logomarks
│   ├── companies/         # Target employer and enterprise logos
│   ├── platforms/         # Identity and OAuth integration providers
│   └── miscellaneous/     # Badges, certification seals, partner marks
│
├── landing/               # Dedicated landing page illustrations & journey infographics
└── fonts/                 # Local typography packages (Andika, Bricolage, JetBrains Mono, Playfair)
```

---

## 2. Icon Registry

All standalone icons are stored as optimized, security-audited SVG vector files.

| Icon Name | Category | File Path | Format | ViewBox / Dimensions | Current Usage |
|---|---|---|---|---|---|
| `dashboard` | `navigation` | `Frontend/src/assets/icons/navigation/dashboard.svg` | SVG | `0 -960 960 960` | Main dashboard navigation (`SideBar.jsx`) |
| `arrow-back` | `navigation` | `Frontend/src/assets/icons/navigation/arrow-back.svg` | SVG | `0 -960 960 960` | Return to home header navigation (`Login.jsx`, `Signup.jsx`) |
| `network-node` | `navigation` | `Frontend/src/assets/icons/navigation/network-node.svg` | SVG | `0 -960 960 960` | Professional network navigation (`SideBar.jsx`) |
| `sidebar` | `navigation` | `Frontend/src/assets/icons/navigation/sidebar.svg` | SVG | `0 -960 960 960` | Sidebar toggle control (Reusable asset) |
| `visibility` | `actions` | `Frontend/src/assets/icons/actions/visibility.svg` | SVG | `0 -960 960 960` | Show password toggle (`PasswordField.jsx`, `ChangePasswordModal.jsx`) |
| `visibility-off` | `actions` | `Frontend/src/assets/icons/actions/visibility-off.svg` | SVG | `0 -960 960 960` | Hide password toggle (`PasswordField.jsx`, `ChangePasswordModal.jsx`) |
| `logout` | `actions` | `Frontend/src/assets/icons/actions/logout.svg` | SVG | `0 -960 960 960` | Account session sign out action (Reusable asset) |
| `search` | `actions` | `Frontend/src/assets/icons/actions/search.svg` | SVG | `0 -960 960 960` | Job discovery search action (`SideBar.jsx`) |
| `error` | `status` | `Frontend/src/assets/icons/status/error.svg` | SVG | `0 -960 960 960` | Form error & API failure states (Reusable asset) |
| `warning` | `status` | `Frontend/src/assets/icons/status/warning.svg` | SVG | `0 -960 960 960` | Alert and caution state indicators (Reusable asset) |
| `notification` | `status` | `Frontend/src/assets/icons/status/notification.svg` | SVG | `0 0 24 24` | System bell notification alert (Reusable asset) |
| `insights` | `analytics` | `Frontend/src/assets/icons/analytics/insights.svg` | SVG | `0 -960 960 960` | Analytics and telemetry navigation (`SideBar.jsx`) |
| `apps` | `applications` | `Frontend/src/assets/icons/applications/apps.svg` | SVG | `0 -960 960 960` | Job application pipeline navigation (`SideBar.jsx`) |
| `profile` | `miscellaneous` | `Frontend/src/assets/icons/miscellaneous/profile.svg` | SVG | `0 -960 960 960` | User account profile icon (Reusable asset) |

---

## 3. Logo Registry

All official brand marks and external identity providers are centralized under `Frontend/src/assets/logos/`.

| Logo Name | Category | File Path | Format | Native Dimensions | Variants / Notes | Current Usage |
|---|---|---|---|---|---|---|
| `evolexa` | `brand` | `Frontend/src/assets/logos/brand/evolexa.svg` | SVG | `121 x 89` (viewBox `0 0 121 89`) | Official vector logomark; fill adapts via CSS | Brand mark identity |
| `job-tracker` | `brand` | `Frontend/src/assets/logos/brand/job-tracker.png` | PNG | `512 x 512` (Raster) | Legacy product logo mark | Preserved historical branding asset |
| `google` | `platforms` | `Frontend/src/assets/logos/platforms/google.svg` | SVG | `48 x 48` (viewBox `-0.5 0 48 48`) | Multi-color official Google G mark | OAuth continue button (`Login.jsx`, `Signup.jsx`) |
| `codesarthi` | `platforms` | `Frontend/src/assets/logos/platforms/codesarthi.svg` | SVG | `1000 x 1000` (Vector + embedded) | Dark/Light media query responsive | OAuth continue button (`Login.jsx`, `Signup.jsx`) |

---

## 4. Dedicated Illustrations & Graphic Artifacts

Per strict design system rules, complex multi-layer narrative illustrations and photographs are not classified as generic icons. They reside in their dedicated domains:

### A. Landing Page Vector Illustrations (`Frontend/src/assets/landing/`)
- `application-journey.svg`: Multi-stage application journey map (Dark theme). Used in `ArchitectureVisualSection.jsx` and `CapabilitiesSection.jsx`.
- `application-journey-light.svg`: Multi-stage application journey map (Light theme). Used in `ArchitectureVisualSection.jsx` and `CapabilitiesSection.jsx`.
- `follow-up-notes.svg`: Timeline note progression illustration. Used in `ArchitectureVisualSection.jsx`.

### B. Public Static Photography & Video (`Frontend/public/`)
- `public/images/career_telemetry_dial.jpg`: Telemetry dial banner
- `public/images/career_trajectory_map.jpg`: Career trajectory background
- `public/images/data_isolation_vault.jpg`: Data isolation security graphic
- `public/images/pipeline_stage_progression.jpg`: Pipeline diagram
- `public/images/precision_monolith_arch.jpg`: Architecture diagram
- `public/images/secure_data_vault.jpg`: Data vault graphic
- `public/images/stage_pipeline_graph.jpg`: Pipeline stage graphic
- `public/images/stage_progression_pipeline.jpg`: Stage progression graphic
- `public/videos/telemetry_poster.jpg` & `telemetry_stream.webm`: Video telemetry demo media

---

## 5. Programmatic Icons & Dynamic Inline SVG Components

Evolexa does not load bulky third-party icon libraries (e.g., `lucide-react` or `@heroicons/react`). Instead, dynamic icons that require tight state binding, reactive theme morphing, or GSAP animation are cleanly implemented as native React inline components:

| Component | Visual Asset | Implementation Type | Reason for Dynamic Rendering |
|---|---|---|---|
| `ThemeToggleButton.jsx` | Sun / Moon switch | Inline SVG | Animated via CSS/GSAP with reactive theme transition |
| `Button.jsx` | Loading Spinner | Inline SVG `<circle>` & `<path>` | Spin keyframe animation controlled by `loading` prop |
| `WarningIcon.jsx` | Warning Triangle | Dedicated JSX SVG component | Form-level validation badge with dynamic stroke/fill |
| `ThemePreferenceCard.jsx` | Theme Preview Panels | 3 SVG layout wireframes | Visual selection preview for Light, Dark, and System modes |
| `EmptyStateVisual.jsx` | Analytics Empty State | Inline parametric SVG | Generates motifs for 'activity', 'pipeline', and 'skills' |
| `PipelineDistributionChart.jsx` | Funnel & Pipeline arcs | Inline SVG + Recharts | Real-time SVG rendering driven by user application telemetry |
| `RadialProgress.jsx` | Circular Progress Gauge | Inline SVG `<circle>` | Dynamic `strokeDashoffset` calculated from percentage |
| `SkillFitChart.jsx` | Radar & Bar Metrics | Inline SVG + Recharts | Reactive multi-dimensional skill gap visualization |
| `ProfileIdentityCard.jsx` | Developer Identity Icons | Inline SVG (Pin, Mail, Stack, Date) | Theme-responsive vector glyphs for location, contact, and tech stack |
| `ProfileCompletenessCard.jsx` | Verified & Checkmark Badges | Inline SVG (Shield, Check, Arrow) | Live profile completion milestone verification indicators |
| `ResumeSection.jsx` | PDF & File Asset Controls | Inline SVG (PDF badge, Cloud, Trash, Eye) | State-reactive resume upload, replacement, and viewer actions |
| `AccountSecurityTab.jsx` | Security Ledger Icons | Inline SVG (Shield, Key, Copy, Check) | Zero-emoji security credential indicators & copy-to-clipboard state |
| `AvatarPreviewModal.jsx` | Lightbox Close Icon | Inline SVG (`X`) | Keyboard-accessible lightbox close control |
| `AvatarCropModal.jsx` | Image Crop & Zoom Controls | Inline SVG (Close, Plus, Minus, Reset, Alert) | Disabled-state & theme-adaptive vector controls inside crop workspace |
| `DashboardMetricStrip.jsx` | Pipeline KPI Micro-Visuals | Inline SVG (Bars, Sparkline, Yield Arc) | Live data-driven micro-telemetry inside Dashboard KPI tiles |
| `DashboardInsightsSection.jsx` | Compass Strategist Icon | Inline SVG Compass (`currentColor`) | Replaces emoji with theme-compatible vector icon |
| `NavBar.jsx` / `SideBar.jsx` | Evolexa Monogram | Stylized HTML/CSS Badge | Text mark ("EX", "ET") with font-display styling |

---

## 6. External / Remote Asset Audit

- **Third-Party Image CDN Dependencies:** None. No images or icons are fetched from external hosting providers at runtime.
- **Remote Fonts:** Google Fonts `@import` declared in `index.css` (`Inter`, `Plus Jakarta Sans`, `Cinzel`, `Manrope`).
- **Data Integrity:** All visual assets are self-contained within the client bundle and offline-capable.

---

## 7. SVG Security & Sanitization Policy

All SVG assets undergo automated verification against script injection and prototype pollution:
1. **Forbidden Elements:** No `<script>`, `<foreignObject>`, `<iframe>`, `<object>`, `<embed>`, or `<applet>` tags.
2. **Forbidden Attributes:** No inline DOM event handlers (`onload`, `onerror`, `onclick`, `onmouseover`, etc.).
3. **No Dynamic Code URIs:** No `javascript:`, `vbscript:`, or `data:text/html` schemes.
4. **Clean Scalability:** All SVGs must include a well-formed `viewBox` and explicit XML namespaces (`xmlns="http://www.w3.org/2000/svg"`).

---

## 8. Developer Guidelines: Adding & Reusing Assets

### Step 1: Search Before Adding
Before creating or downloading a new icon:
1. Inspect the tables in Section 2 and Section 3 of this catalog.
2. Check if a semantically equivalent icon already exists (e.g., use `actions/visibility.svg` instead of adding an `eye.svg`).

### Step 2: Naming Convention
- All asset filenames must be **lowercase kebab-case** (e.g., `arrow-back.svg`, `network-node.svg`).
- Filenames should describe the semantic concept, not a temporary design state (e.g., `logout.svg`, not `exit-white-icon.svg`).

### Step 3: Location Assignment
- Navigation links $\rightarrow$ `Frontend/src/assets/icons/navigation/`
- User actions and buttons $\rightarrow$ `Frontend/src/assets/icons/actions/`
- State indicators & alerts $\rightarrow$ `Frontend/src/assets/icons/status/`
- Charts, telemetry, metrics $\rightarrow$ `Frontend/src/assets/icons/analytics/`
- Domain objects & pipelines $\rightarrow$ `Frontend/src/assets/icons/applications/`
- Social media and links $\rightarrow$ `Frontend/src/assets/icons/social/`
- Brand & Partner logos $\rightarrow$ `Frontend/src/assets/logos/{brand|companies|platforms}/`

### Step 4: Importing in React Components
Always import directly from the centralized path:
```javascript
// Correct: Direct semantic import
import dashboardIcon from '@/assets/icons/navigation/dashboard.svg'
import searchIcon from '@/assets/icons/actions/search.svg'
import googleIcon from '@/assets/logos/platforms/google.svg'

// Incorrect: Deep unorganized or legacy path
import dashboardIcon from '../../assets/icons/dashboard.svg'
```

### Step 5: Update this Catalog
Whenever an asset is added, renamed, or migrated, update this `ASSET_CATALOG.md` file in the same pull request.
