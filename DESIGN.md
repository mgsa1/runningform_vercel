# RunningForm — Design System

Aesthetic: Premium consumer fitness. Warm, confident, trustworthy.
Reference: Apple Fitness+, Strava, Whoop — layered dark surfaces, generous radii, color-coded feedback, brand personality.

---

## Design Principles

1. **Depth over flatness** — Surfaces stack visually. Background → surface → elevated → overlay. No single-plane UIs.
2. **Color communicates meaning** — Score rings, severity accents, and trend lines use color to convey information instantly, before the user reads a number.
3. **Soft geometry, hard data** — Rounded containers make dense biomechanics data feel approachable. The data is precise; the container is warm.
4. **Breathing room, not dead space** — Tight rhythm between related elements, generous padding within cards. No `py-32` voids.
5. **Brand presence** — A single accent color (teal) runs through CTAs, active states, and interactive elements. It's the thread that says "this is RunningForm."

---

## Color Tokens

```css
/* Background layers — warm charcoal, not pure black */
--color-bg:             #111116;   /* app background — dark slate with subtle warmth */
--color-surface:        #1A1A22;   /* cards, panels — visible lift from bg */
--color-surface-raised: #22222C;   /* elevated elements — modals, popovers, active cards */
--color-border:         #2A2A35;   /* subtle borders — visible but not harsh */
--color-border-strong:  #3A3A48;   /* emphasized borders — active states, hover */

/* Text — warm whites, not clinical */
--color-text:           #F0F0F5;   /* primary — soft white, not pure #FFF */
--color-text-secondary: #9898A8;   /* secondary — descriptions, metadata */
--color-text-tertiary:  #5C5C6E;   /* tertiary — hints, disabled, timestamps */

/* Brand accent — teal */
--color-accent:         #2DD4BF;   /* primary accent — CTAs, links, active states */
--color-accent-hover:   #14B8A6;   /* hover/pressed state */
--color-accent-subtle:  rgba(45, 212, 191, 0.12);  /* accent backgrounds, highlights */
--color-accent-ring:    rgba(45, 212, 191, 0.25);  /* focus rings */

/* CTA buttons */
--color-cta-bg:         #F0F0F5;   /* primary button fill — soft white */
--color-cta-text:       #111116;   /* primary button label */
--color-cta-hover:      #D8D8E0;   /* primary button hover */

/* Semantic — softened for coaching context */
--color-good:           #34D399;   /* emerald-400 — achievement, on-track */
--color-good-subtle:    rgba(52, 211, 153, 0.12);
--color-moderate:       #FBBF24;   /* amber-400 — attention, room to improve */
--color-moderate-subtle: rgba(251, 191, 36, 0.12);
--color-critical:       #F97316;   /* orange-400 — priority focus area */
--color-critical-subtle: rgba(249, 115, 22, 0.12);
--color-minor:          #7C7C8E;   /* muted — low priority, informational */
--color-error:          #EF4444;   /* red-500 — system errors only, never for form feedback */
```

### Tailwind mapping

```
Background:       bg-[--color-bg]         or  bg-[#111116]
Surface:          bg-[--color-surface]    or  bg-[#1A1A22]
Raised:           bg-[--color-surface-raised] or bg-[#22222C]
Border:           border-[--color-border] or  border-[#2A2A35]
Text primary:     text-[--color-text]     or  text-[#F0F0F5]
Text secondary:   text-[--color-text-secondary] or text-[#9898A8]
Text tertiary:    text-[--color-text-tertiary]  or text-[#5C5C6E]
Accent:           text-[--color-accent]   or  text-teal-400
```

### Dark mode philosophy

- **Never use `bg-black` or `#000000`** for surfaces. The darkest surface is `--color-bg` (#111116).
- Pure black (`#000000`) is only used for media containers (video frames, image backgrounds) where true black prevents color bleed.
- Background → surface → raised creates a 3-tier elevation system. Each step is subtle but visible.

---

## Typography

Font: **Plus Jakarta Sans** (variable, loaded as `--font-heading`)

| Role | Weight | Size | Tracking | Tailwind |
|---|---|---|---|---|
| Page title | 700 | 28–32px | -0.02em | `text-3xl font-bold tracking-tight` |
| Section heading | 600 | 20–24px | -0.01em | `text-xl font-semibold` |
| Card title | 600 | 16–18px | normal | `text-base font-semibold` or `text-lg font-semibold` |
| Body | 400 | 15–16px | normal | `text-[15px] leading-relaxed` or `text-base leading-relaxed` |
| Small body | 400 | 14px | normal | `text-sm leading-relaxed` |
| Label | 500 | 12–13px | 0.03em | `text-xs font-medium tracking-wide` |
| Eyebrow | 500 | 11–12px | 0.06em, uppercase | `text-[11px] font-medium tracking-widest uppercase text-[--color-text-tertiary]` |
| Mono data | 500 | 13–14px | normal | `text-sm font-mono font-medium` |

### Type rules

- **No `font-extrabold` (800)** anywhere in the app. `font-bold` (700) is the maximum weight.
- Hero/display sizes cap at `text-4xl` (36px). No `text-7xl`+ display text.
- Body text uses `leading-relaxed` (1.625) for readability on dark backgrounds.
- Numbers in data displays use `font-mono` for alignment and precision feel.

---

## Spacing System

| Token | Value | Usage |
|---|---|---|
| Page padding | `px-5 sm:px-8 lg:px-12` | All page containers |
| Content max-width | `max-w-4xl` | Body content — tighter than before |
| Section gap | `py-10 sm:py-14` | Between major sections |
| Card gap | `gap-3 sm:gap-4` | Between cards in a list |
| Card internal | `p-5 sm:p-6` | Card padding |
| Tight group | `gap-2` | Related elements (badge groups, inline metadata) |
| Element spacing | `space-y-4` or `space-y-6` | Within sections, between blocks |

### Spacing philosophy

- Related items stay close (`gap-2` to `gap-4`). Unrelated sections breathe (`py-10`+).
- Cards never feel cramped internally — `p-5` minimum.
- No spacing value exceeds `py-16` on any page. The old `py-24`/`py-32` voids are gone.

---

## Shape & Radius

Generous, consistent radii. Everything feels approachable.

| Element | Radius | Tailwind |
|---|---|---|
| Cards / panels | 16px | `rounded-2xl` |
| Buttons (primary) | 12px | `rounded-xl` |
| Buttons (small/secondary) | 10px | `rounded-[10px]` |
| Input fields | 12px | `rounded-xl` |
| Badges / chips | 8px | `rounded-lg` |
| Status pills | 20px (full) | `rounded-full` |
| Score ring container | circle | SVG — inherently round |
| Tooltips / popovers | 12px | `rounded-xl` |
| Media containers | 12px | `rounded-xl overflow-hidden` |

### Shape rules

- **No `rounded-none`** on any interactive or content element.
- **No `rounded-sm`** — minimum radius is `rounded-lg` (8px) for small elements.
- Cards always have `rounded-2xl`. This is non-negotiable.
- Media (frames, video) clips to `rounded-xl` via `overflow-hidden` on the container.

---

## Elevation & Surfaces

Depth is created through background color steps and subtle borders — no `box-shadow` on dark mode.

| Level | Background | Border | Usage |
|---|---|---|---|
| Ground | `--color-bg` | none | Page background |
| Surface | `--color-surface` | `--color-border` | Cards, panels, nav |
| Raised | `--color-surface-raised` | `--color-border-strong` | Active cards, dropdowns, modals |
| Overlay | `rgba(0,0,0,0.6)` | none | Modal backdrops, image overlays |

```html
<!-- Standard card -->
<div class="bg-[--color-surface] border border-[--color-border] rounded-2xl p-5">

<!-- Active/hover card -->
<div class="bg-[--color-surface-raised] border border-[--color-border-strong] rounded-2xl p-5">
```

---

## Buttons

**Primary:**
```html
<button class="px-6 py-2.5 min-h-[44px] bg-[--color-cta-bg] text-[--color-cta-text]
               font-semibold text-sm rounded-xl
               hover:bg-[--color-cta-hover] active:scale-[0.98]
               transition-all duration-150">
  Upload new
</button>
```

**Accent (brand action):**
```html
<button class="px-6 py-2.5 min-h-[44px] bg-[--color-accent] text-[--color-bg]
               font-semibold text-sm rounded-xl
               hover:bg-[--color-accent-hover] active:scale-[0.98]
               transition-all duration-150">
  Get started
</button>
```

**Secondary (ghost):**
```html
<button class="px-6 py-2.5 min-h-[44px] border border-[--color-border-strong] text-[--color-text]
               font-medium text-sm rounded-xl
               hover:bg-[--color-surface-raised] hover:border-[--color-text-tertiary]
               active:scale-[0.98] transition-all duration-150">
  Sign in
</button>
```

**Tertiary (inline action):**
```html
<button class="px-3 py-1.5 text-xs font-medium text-[--color-text-secondary]
               border border-[--color-border] rounded-[10px]
               hover:text-[--color-text] hover:border-[--color-border-strong]
               transition-colors duration-150">
  Watch drill
</button>
```

---

## Navigation

### Desktop (md+)
```
[Logo left]                              [History  Upload  Sign out]
```
- `bg-[--color-surface]/80 backdrop-blur-md border-b border-[--color-border]`
- Sticky top: `sticky top-0 z-50`
- Logo: existing SVG, height 28px
- Links: `text-sm font-medium text-[--color-text-secondary] hover:text-[--color-text] transition-colors`
- Active link: `text-[--color-text]`

### Mobile (< md)
- Header: logo + minimal right action
- **Bottom tab bar:** `fixed bottom-0 left-0 right-0 h-16 bg-[--color-surface]/90 backdrop-blur-md border-t border-[--color-border] md:hidden`
- Safe area: `pb-[env(safe-area-inset-bottom)]`
- Active tab: `text-[--color-accent]`, inactive: `text-[--color-text-tertiary]`

---

## Score Ring

The score ring is the hero data visualization. It must communicate performance at a glance through color.

### Color tiers

| Score | Ring color | Tailwind stroke | Meaning |
|---|---|---|---|
| 75–100 | Emerald | `stroke-emerald-400` (#34D399) | Strong form |
| 50–74 | Amber | `stroke-amber-400` (#FBBF24) | Room to improve |
| 25–49 | Orange | `stroke-orange-400` (#FB923C) | Needs attention |
| 0–24 | Red | `stroke-red-400` (#F87171) | Priority fix |

### Implementation

```
- SVG circle, `strokeWidth="6"` (thinner than before for elegance)
- Background track: `stroke="var(--color-border)"` (#2A2A35)
- Score arc: color from tier table above
- Score text: `fill="var(--color-text)"` — the number is always soft white
- Subscript "/100": `fill="var(--color-text-tertiary)"` — deemphasized
- Animate on mount: `stroke-dashoffset` transition, 800ms ease-out, 200ms delay
```

### Sizes

| Context | Diameter | Tailwind |
|---|---|---|
| History card (mobile) | 44px | `w-11 h-11` |
| History card (desktop) | 52px | `w-13 h-13` |
| Results hero | 96px | `w-24 h-24` |
| Progress dashboard | 96px | `w-24 h-24` |

---

## Severity System

Severity communicates coaching priority, not system errors. The language is motivational, not clinical.

### Colors

| Severity | Text color | Accent | Background | Border accent |
|---|---|---|---|---|
| critical | `text-orange-400` | `bg-orange-400/12` | `--color-surface` | `border-l-[3px] border-l-orange-400` |
| moderate | `text-amber-400` | `bg-amber-400/12` | `--color-surface` | `border-l-[3px] border-l-amber-400/60` |
| minor | `text-[--color-text-secondary]` | none | `--color-surface` | `border-l-[3px] border-l-[--color-border-strong]` |
| good | `text-emerald-400` | `bg-emerald-400/12` | none | none — uses checkmark icon |

### Fix plan cards

```html
<!-- Critical fix card -->
<div class="bg-[--color-surface] border border-[--color-border] border-l-[3px] border-l-orange-400
            rounded-2xl p-5 space-y-4">
  <h3 class="text-base font-semibold text-orange-400">Vertical Oscillation</h3>
  <p class="text-sm text-[--color-text-secondary] leading-relaxed">...</p>
</div>
```

### Measured value blocks

```html
<div class="bg-[--color-surface-raised] rounded-xl px-4 py-3 flex items-center justify-between">
  <span class="text-xs font-medium text-[--color-text-tertiary]">You:</span>
  <span class="text-sm font-mono font-medium text-[--color-text]">17.7% body height</span>
</div>
```

---

## Badges & Pills

**Status badge (history cards):**
```html
<!-- Complete -->
<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
             bg-emerald-400/12 text-emerald-400">Complete</span>
<!-- Processing -->
<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
             bg-[--color-accent-subtle] text-[--color-accent]">Processing</span>
<!-- Failed -->
<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
             bg-red-400/12 text-red-400">Failed</span>
```

**Video quality badge:**
```html
<!-- Good -->
<span class="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-400/12 text-emerald-400">Good</span>
<!-- Fair -->
<span class="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-400/12 text-amber-400">Fair</span>
<!-- Poor -->
<span class="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-400/12 text-red-400">Poor</span>
```

**Dosage tags (drill cards):**
```html
<span class="px-2.5 py-1 rounded-lg text-xs font-medium bg-[--color-surface-raised]
             text-[--color-text-secondary] border border-[--color-border]">2–3x per week</span>
```

---

## Score Trend Chart

- Line color: `stroke="var(--color-accent)"` (teal) — single color, no traffic-light dots
- Dot fill: same teal accent, with `stroke="var(--color-surface)"` for halo
- Active/latest dot: larger (6px radius vs 4px), filled accent
- Reference lines (25/50/75): `stroke="var(--color-border)"` dashed
- Grid: minimal — only horizontal reference lines, no vertical grid
- Axes labels: `text-[11px] text-[--color-text-tertiary] font-mono`

---

## History Page

### Progress dashboard card
```html
<div class="bg-[--color-surface] border border-[--color-border] rounded-2xl p-6">
  <!-- Score ring + stats row -->
  <!-- Trend chart below -->
</div>
```

### Session cards
```html
<div class="flex items-center gap-4 px-5 py-4
            hover:bg-[--color-surface] rounded-xl transition-colors duration-150 cursor-pointer">
  <!-- Score ring (44px) -->
  <!-- File name + status badges -->
  <!-- Date right-aligned -->
</div>
```

- Sessions are rows in a list, not bordered cards. Hover reveals the surface color.
- Dividers between sessions: `border-b border-[--color-border]` — single pixel, subtle.

### Empty state
```
[Centered, py-16]
  Illustration or subtle icon (optional)
  "No runs analyzed yet" — text-lg font-semibold text-[--color-text]
  "Upload your first video to get started." — text-sm text-[--color-text-secondary] mt-2
  [Upload a video] — accent button, mt-6
```

---

## Results Page

### Hero section
```
[Score ring 96px]  [Headline text + quality badge]
```
- Headline: `text-base text-[--color-text-secondary] leading-relaxed` — the AI summary, not a heading
- Quality badge: uses the quality badge style from Badges section

### Doing Well section
- Eyebrow: `DOING WELL` — `text-[11px] tracking-widest uppercase text-emerald-400/70`
- Each trait: `flex items-start gap-3` with a `✓` icon in `text-emerald-400`
- Collapsible via `<details>` — observation text in `text-sm text-[--color-text-secondary]`

### Fix Plan section
- Eyebrow: `YOUR FIX PLAN` — `text-[11px] tracking-widest uppercase text-[--color-text-tertiary]`
- Subtitle: `4 drills ranked by priority` — `text-xs text-[--color-text-tertiary]`
- Cards use severity card pattern from Severity section
- Drill cards nested inside: `bg-[--color-surface-raised] rounded-xl p-4`

### Biomechanics section
```html
<div class="bg-[--color-surface] border border-[--color-border] rounded-2xl p-5 space-y-5">
  <div class="flex items-center justify-between">
    <h3 class="text-base font-semibold text-[--color-text]">Biomechanics</h3>
    <span class="text-xs text-[--color-text-tertiary]">3 gait cycles detected</span>
  </div>
  <!-- Metric rows -->
</div>
```

### Biomechanics range bars
```
- Track: bg-[--color-surface-raised] h-1.5 rounded-full
- Good zone: bg-emerald-400/20 (overlaid)
- Marker dot: 10px circle, color from severity, with ring-2 ring-[--color-surface]
- Label left: metric name in text-sm font-medium
- Value right: text-sm font-mono
```

---

## Upload Drop Zone

```html
<div class="border-2 border-dashed border-[--color-border-strong] rounded-2xl p-12
            hover:border-[--color-accent]/50 hover:bg-[--color-accent-subtle]
            transition-all duration-200 cursor-pointer text-center">
  <!-- Upload icon: text-[--color-text-tertiary], 32px -->
  <p class="text-sm font-medium text-[--color-text-secondary] mt-4">Drop a video or tap to browse</p>
  <p class="text-xs text-[--color-text-tertiary] mt-1">MP4 or MOV, under 100MB</p>
</div>
```

Drag-over state: `border-[--color-accent] bg-[--color-accent-subtle]`

---

## Status Page (Analyzing...)

```html
<div class="flex flex-col items-center justify-center min-h-[60vh] text-center">
  <!-- Animated score ring (spinning arc) — 64px, accent color stroke -->
  <h2 class="text-xl font-semibold text-[--color-text] mt-6">Analyzing your run</h2>
  <p class="text-sm text-[--color-text-secondary] mt-2">Examining stride, posture, and arm drive...</p>
  <p class="text-xs text-[--color-text-tertiary] mt-4">Usually takes 30–60 seconds</p>
</div>
```

- Spinner arc uses `stroke="var(--color-accent)"` — teal, not white.

---

## Landing Page Layout

```
[Nav — sticky, blurred surface]

[Hero section — py-16 lg:py-24, centered on mobile, left-aligned on desktop]
  Eyebrow: "AI Running Coach" — text-[11px] tracking-widest uppercase text-[--color-accent]
  H1: "Run better." — text-4xl sm:text-5xl font-bold tracking-tight
  Subtitle: max-w-md, text-base text-[--color-text-secondary] mt-4 leading-relaxed
  CTA group: mt-8 flex gap-3
    [Get started] — accent button
    [Sign in] — secondary button

[Steps section — py-10, max-w-3xl]
  3 cards or rows:
    Step number: text-[--color-accent] font-mono font-semibold
    Title: text-base font-semibold text-[--color-text]
    Body: text-sm text-[--color-text-secondary]
  Cards: bg-[--color-surface] rounded-2xl p-5, stacked with gap-3

[Disclaimer — py-8, text-xs text-[--color-text-tertiary] text-center]
```

---

## Motion

| Interaction | Animation |
|---|---|
| Page transition | `opacity-0 → opacity-100`, 150ms ease |
| Score ring mount | `stroke-dashoffset` animated, 800ms ease-out, 200ms delay |
| Card hover | `bg-transparent → bg-[--color-surface]`, 150ms ease |
| Button hover | `transition-all duration-150` |
| Button press | `active:scale-[0.98]` |
| Focus ring | `ring-2 ring-[--color-accent-ring]` — teal glow |
| Details expand | `transition-transform duration-200` on chevron |
| Overlay fade | `transition-opacity duration-200` |

### Motion rules
- No scroll-triggered animations. No parallax. No entrance animations below the fold.
- All transitions are 100–200ms. Nothing feels sluggish.
- `prefers-reduced-motion: reduce` disables all non-essential motion.

---

## Accessibility

- All interactive elements have `min-h-[44px]` touch targets.
- Focus states: `focus-visible:ring-2 focus-visible:ring-[--color-accent-ring] focus-visible:outline-none`
- Color is never the sole indicator — always paired with text labels or icons.
- Contrast ratios: `--color-text` on `--color-bg` meets WCAG AA (>7:1). `--color-text-secondary` on `--color-bg` meets AA (>4.5:1).
- Score ring colors are paired with the numeric score — color reinforces, doesn't replace.

---

## What NOT to Build

- No `bg-black` or `#000000` backgrounds (except media containers)
- No `rounded-none` on any element
- No `font-extrabold` (800 weight)
- No `text-7xl` or larger display text
- No `py-24`+ section gaps
- No pure `#FFFFFF` text (use `--color-text` / `#F0F0F5`)
- No traffic-light colored chart dots (single accent color for trends)
- No raw Tailwind color-500 for severity (use the -400 variants with /12 backgrounds)
- No purple/indigo gradients, blob decorations, or wavy dividers
- No emoji in UI copy
