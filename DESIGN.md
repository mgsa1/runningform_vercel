# RunningForm — Design System

Aesthetic: Minimalist, editorial, high-contrast, modern tech-forward.
Reference: ochy.io/runners — confident, sparse, performance-tool feel.

---

## Color Tokens

```css
/* Background */
--color-bg:          #000000;   /* pure black — not gray-950 */
--color-surface:     #0A0A0A;   /* cards, panels — barely-visible lift */
--color-border:      #1A1A1A;   /* separators, card edges */

/* Text */
--color-text:        #FFFFFF;   /* primary */
--color-text-muted:  #888888;   /* secondary, subheads, captions */
--color-text-dim:    #444444;   /* tertiary, disabled */

/* CTA (no accent color — pure editorial contrast) */
--color-cta-bg:      #FFFFFF;   /* primary button fill */
--color-cta-text:    #000000;   /* primary button label */
--color-ghost-border: #FFFFFF;  /* ghost/secondary button border */

/* Functional (results page severity only) */
--color-good:        #22C55E;   /* green-500 — trait status: good */
--color-critical:    #EF4444;   /* red-500 — severity: critical */
--color-moderate:    #F59E0B;   /* amber-500 — severity: moderate */
--color-minor:       #6B7280;   /* gray-500 — severity: minor */
```

Tailwind classes to use:
- Background: `bg-black` (replace all `bg-gray-950`)
- Surface: `bg-[#0A0A0A]`
- Border: `border-[#1A1A1A]`
- Text primary: `text-white`
- Text muted: `text-[#888888]` (replace `text-gray-400`)

---

## Typography

Font: **Plus Jakarta Sans** (already installed as `--font-heading`)

| Role | Weight | Size | Tailwind |
|---|---|---|---|
| Display hero | 800 | 80–120px | `text-7xl sm:text-9xl font-extrabold tracking-tight` |
| H1 | 700 | 48–64px | `text-5xl sm:text-6xl font-bold tracking-tight` |
| H2 | 600 | 28–32px | `text-3xl font-semibold` |
| H3 / Card title | 600 | 20px | `text-xl font-semibold` |
| Body | 400 | 16px | `text-base leading-7` |
| Small label | 500 | 12px, uppercase | `text-xs font-medium tracking-widest uppercase` |
| Eyebrow | 500 | 12px, uppercase | `text-xs font-medium tracking-widest uppercase text-[#888888]` |

---

## Spacing System

| Token | Value | Usage |
|---|---|---|
| Page horizontal padding | `px-6 sm:px-10 lg:px-16` | All page containers |
| Content max-width | `max-w-5xl` | Body content (wider than old max-w-2xl) |
| Section gap | `py-24 sm:py-32` | Between major sections |
| Card gap | `gap-4` | Between cards in a list |
| Component internal | `p-6` | Card padding |

---

## Shape & Radius

No rounded borders except where functionally meaningful.

| Element | Radius |
|---|---|
| Primary CTA button | `rounded-none` |
| Ghost button | `rounded-none` |
| Cards / panels | `rounded-none` with `border border-[#1A1A1A]` |
| Status badges | `rounded-sm` (2px) |
| Score ring | SVG circle — no border-radius |
| Input fields | `rounded-none` |

---

## Buttons

**Primary (CTA):**
```html
class="px-8 py-3 min-h-[44px] bg-white text-black font-semibold text-sm
       tracking-wide hover:bg-[#E5E5E5] transition-colors duration-100"
```

**Ghost / Secondary:**
```html
class="px-8 py-3 min-h-[44px] border border-white text-white font-semibold
       text-sm tracking-wide hover:bg-white hover:text-black transition-colors duration-100"
```

**Destructive:**
```html
class="px-6 py-2 border border-red-500/40 text-red-400 text-sm font-medium
       hover:border-red-500 hover:text-red-300 transition-colors"
```

---

## Navigation

### Desktop (md+)
```
[Logo left]                    [History  Upload  Sign out]
— no border-bottom — floats into page background —
```
- `bg-transparent` (not `bg-gray-950`)
- No `border-b`
- Logo: existing SVG, height 34px
- Links: `text-sm font-medium text-[#888888] hover:text-white transition-colors`
- Sign out: same muted style, not a button

### Mobile (< md)
- Header: logo only (no nav links)
- **Bottom tab bar:** `fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-[#1A1A1A] md:hidden`
- Tabs: History (ClockIcon), Upload (PlusIcon), Account (UserIcon)
- Active tab: `text-white`, inactive: `text-[#444444]`

---

## Landing Page Layout

```
[Nav — transparent, logo left]

[Hero section — py-32 lg:py-48, left-aligned]
  EYEBROW: "AI Running Coach" — text-xs tracking-widest uppercase text-[#888888]
  H1: "Run Better." — display weight, text-7xl sm:text-9xl
  SUBHEAD: "If you're running, you're already doing it right.
            Let's see how to make it better." — text-lg text-[#888888] mt-6 max-w-lg
  CTA group: mt-10 flex gap-4
    [Get started free] — primary button
    [Sign in] — ghost button

[Steps section — py-24, left-aligned]
  3 editorial blocks, NOT icon circles:
  ┌─────────────────────────────────────────────────────┐
  │  01     Film a short clip                           │
  │         Any phone. 30 seconds of running.           │
  ├─────────────────────────────────────────────────────┤
  │  02     Get frame-by-frame analysis                 │
  │         AI examines your stride, arm drive, lean.   │
  ├─────────────────────────────────────────────────────┤
  │  03     Practice with matched drills                │
  │         Specific drills for what needs work.        │
  └─────────────────────────────────────────────────────┘
  Index number: text-xs font-medium tracking-widest text-[#444444]
  Title: text-base font-semibold text-white
  Body: text-sm text-[#888888]
  Separator: border-b border-[#1A1A1A]

[Disclaimer — py-12, text-xs text-[#444444] text-center]
```

---

## History Page

### Empty state (first-time user)
```
[Center of content area, py-32]
  "0 analyses" — text-7xl font-extrabold text-[#1A1A1A] (huge, decorative)
  "No runs analyzed yet" — text-xl font-semibold text-white mt-6
  "Upload your first video to get started." — text-[#888888] mt-2
  [Upload a video →] — primary button mt-8
```

### Session cards
- `bg-[#0A0A0A] border border-[#1A1A1A]` — no rounded corners
- Score ring: 48px on mobile, 64px on desktop
- File name: `text-sm font-medium text-white`
- Date: `text-xs text-[#888888]`
- Status badge: `rounded-sm text-xs font-medium tracking-wide`

---

## Score Ring

- SVG circle with `stroke` = `#FFFFFF`
- Background track: `stroke` = `#1A1A1A`
- Score 0–100 maps to stroke-dashoffset
- **No color gradient** — white stroke only
- Opacity variation optional: very low scores (< 30) can dim to 60% opacity
- Animate on mount: `transition: stroke-dashoffset 1s ease-out`

---

## Upload Drop Zone

```
border: 1px dashed rgba(255, 255, 255, 0.3)   ← 30% white
hover:  border-color: rgba(255, 255, 255, 1.0) ← 100% white
drag-over: border-color: #FFFFFF + bg: rgba(255,255,255,0.03)
```
- Large centered upload icon (simple arrow-up or camera)
- `text-sm text-[#888888]` label
- `text-xs text-[#444444]` secondary hint

---

## Results Page Severity

Replace colored-pill badges with editorial text treatment:

| Severity | Treatment |
|---|---|
| critical | `text-red-400 font-semibold` + left accent line `border-l-2 border-red-500 pl-3` |
| moderate | `text-amber-400 font-medium` + left accent line `border-l-2 border-amber-500/60 pl-3` |
| minor | `text-[#888888]` + left accent line `border-l-2 border-[#444444] pl-3` |
| good | `text-green-400` + no left border |

---

## Status Page (Analyzing...)

Replace generic spinner with purposeful copy:

```
[Large centered]
  Score ring animating (spinning white arc) — 64px
  "Analyzing your run" — text-xl font-semibold mt-6
  "Examining stride, arm drive, and posture..." — text-sm text-[#888888] mt-2
  [small text: "Usually takes 30–60 seconds"]
```

---

## Motion

| Interaction | Animation |
|---|---|
| Page load | `opacity-0` → `opacity-100`, 200ms ease |
| Score ring | `stroke-dashoffset` animated, 1s ease-out, delay 300ms |
| Button hover | `transition-colors duration-100` |
| Button press | `active:scale-[0.98]` |
| Status page ring | `animate-spin` on arc segment |

No decorative scroll animations. No parallax. No entrance animations on content below fold.

---

## What NOT to build

- No colored circles with numbers (replace with editorial index numbers)
- No `bg-blue-600` anywhere
- No `rounded-lg` on primary surfaces
- No `text-center` on hero (left-aligned only)
- No icon-in-circle decoration patterns
- No purple/indigo gradients
- No blob decorations or wavy dividers
- No emoji in UI copy
