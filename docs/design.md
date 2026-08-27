# Design System — KukkutPro

> This document defines the visual language for the entire application. The coding agent must use these tokens consistently. Do not introduce new colours, fonts, or spacing values without updating this document.

---

## Design Philosophy

**Simple. Honest. Fast.**

The target user opens this app at the end of a farm workday — possibly outdoors, on a dusty phone, tired. The design must:

1. **Prioritise numbers** — Financial figures are the product. Make them large, clear, and readable at a glance.
2. **Reduce cognitive load** — One action per screen when possible. Never ask the user to calculate anything.
3. **Communicate status instantly** — Green = good, Amber = attention needed, Red = problem. Consistent throughout.
4. **Feel native on Android** — Cards, bottom sheets, FAB (floating action button). Not a desktop UI squeezed onto mobile.
5. **Respect the user's time** — Every tap must have a clear purpose. No decorative chrome.

---

## Typography

**Primary font:** `Inter` (Google Fonts)
**Fallback:** `system-ui, -apple-system, sans-serif`

| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `text-display` | 32px | 700 | 1.2 | Large money amounts on dashboard |
| `text-heading-1` | 24px | 600 | 1.3 | Page titles |
| `text-heading-2` | 20px | 600 | 1.3 | Section headers, card titles |
| `text-heading-3` | 16px | 600 | 1.4 | Sub-section labels |
| `text-body-lg` | 16px | 400 | 1.5 | Primary body copy |
| `text-body` | 14px | 400 | 1.5 | Standard body, form labels |
| `text-body-sm` | 12px | 400 | 1.5 | Supporting text, captions |
| `text-caption` | 11px | 400 | 1.4 | Timestamps, metadata |
| `text-label` | 12px | 500 | 1.4 | Input labels, tags |

**Numeric display rule:** All financial figures use `font-variant-numeric: tabular-nums` so digits align in columns.

**Hindi labels:** Use `Noto Sans Devanagari` as a fallback for any Hindi text. Load it from Google Fonts alongside Inter.

---

## Colour Palette

### Brand

| Token | Hex | Usage |
|---|---|---|
| `brand-500` | `#E67E22` | Primary brand colour (warm orange — farm/harvest) |
| `brand-600` | `#CA6F1E` | Hover / pressed state of primary |
| `brand-100` | `#FDEBD0` | Light brand background, tags |
| `brand-50` | `#FEF9F3` | Page background tint |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `success-500` | `#27AE60` | Positive: stock sufficient, fully paid, cash confirmed |
| `success-100` | `#D5F5E3` | Success background |
| `warning-500` | `#F39C12` | Caution: partial payment, low stock warning |
| `warning-100` | `#FDEBD0` | Warning background |
| `danger-500` | `#E74C3C` | Error: overdue dues, insufficient stock, blocked action |
| `danger-100` | `#FADBD8` | Error background |
| `info-500` | `#2980B9` | Informational: credit sale, advance payment |
| `info-100` | `#D6EAF8` | Info background |

### Neutral

| Token | Hex | Usage |
|---|---|---|
| `neutral-900` | `#1A1A1A` | Primary text |
| `neutral-700` | `#4A4A4A` | Secondary text |
| `neutral-500` | `#7A7A7A` | Placeholder, disabled text |
| `neutral-300` | `#C5C5C5` | Borders, dividers |
| `neutral-100` | `#F5F5F5` | Input backgrounds, subtle fills |
| `neutral-50` | `#FAFAFA` | Page background |
| `white` | `#FFFFFF` | Card backgrounds |

### Financial Colour Convention (used everywhere)

| Colour | Meaning |
|---|---|
| `success-500` (green) | Money coming in: cash received, payment received |
| `danger-500` (red) | Money going out: expenses, salary, dues owed |
| `warning-500` (amber) | Attention needed: partial payment, low stock |
| `neutral-700` (grey) | Neutral information: dates, notes |

---

## Spacing Scale

Based on a 4px base unit. Use only these values — no arbitrary pixel values.

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Micro gap: icon + label |
| `space-2` | 8px | Tight: list item internal padding |
| `space-3` | 12px | Card internal padding (tight) |
| `space-4` | 16px | Standard padding: card, form field |
| `space-5` | 20px | Comfortable: section gap |
| `space-6` | 24px | Page section gap |
| `space-8` | 32px | Large separation: between sections |
| `space-10` | 40px | Extra large: page top padding |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 6px | Small elements: tags, chips, badges |
| `radius-md` | 10px | Cards, input fields, buttons |
| `radius-lg` | 16px | Bottom sheets, modal panels |
| `radius-full` | 9999px | Pill buttons, avatar circles |

---

## Elevation / Shadow

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | Cards, input focus |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.12)` | FAB, dropdown menus |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.16)` | Bottom sheets, modals |

---

## Components

### Buttons

**Primary Button**
- Background: `brand-500`
- Text: white, `text-body`, weight 600
- Padding: `space-3 space-6` (12px 24px)
- Border radius: `radius-md`
- Hover: `brand-600`
- Active: scale(0.97)
- Disabled: `neutral-300` bg, `neutral-500` text, cursor not-allowed

**Secondary Button**
- Background: white
- Border: 1.5px `brand-500`
- Text: `brand-500`
- Same sizing as primary

**Danger Button**
- Background: `danger-500`
- Text: white
- Use only for destructive/void actions

**Ghost Button / Text Button**
- No background, no border
- Text: `brand-500` or `neutral-700`
- Use for low-emphasis actions

**Icon Button**
- 44×44px tap target (accessibility minimum)
- Background: `neutral-100` on tap

**FAB (Floating Action Button)**
- Size: 56×56px
- Background: `brand-500`
- Shadow: `shadow-md`
- Icon: white, 24px
- Position: bottom-right, 20px from edge
- Used on list screens to trigger the primary "add" action

---

### Cards

**Standard Card**
- Background: white
- Border: 1px `neutral-300`
- Border radius: `radius-md`
- Padding: `space-4`
- Shadow: `shadow-sm`

**Summary Card (Dashboard)**
- Background: white
- Left accent border: 4px, semantic colour
- Used for financial summary figures

**List Row**
- Min height: 64px
- Padding: `space-4`
- Divider: 1px `neutral-100` between rows
- No card shadow — rows live inside a card

---

### Inputs

**Text Input / Number Input**
- Height: 48px
- Background: `neutral-100`
- Border: 1.5px `neutral-300`
- Border radius: `radius-md`
- Padding: `space-4`
- Font: `text-body-lg`
- Focus: border `brand-500`, `shadow-sm`
- Error: border `danger-500`, background `danger-100`
- Placeholder: `neutral-500`

**Label**
- `text-label`, `neutral-700`
- 8px above the input
- Required indicator: `*` in `danger-500`

**Inline error message**
- `text-body-sm`, `danger-500`
- 4px below the input
- No icon — keep it minimal

**Number input special rule:**  
All financial inputs show a `₹` prefix inside the field. Egg quantity inputs show the unit (eggs / trays / peti) as a suffix.

---

### Select / Dropdown

- Same visual as input
- Chevron icon on right
- Opens as a bottom sheet on mobile (not a native select)
- Search within dropdown if > 10 options (e.g., customer select)

---

### Navigation

**Bottom Navigation Bar**
- 5 tabs maximum (Dashboard, Daily, Sales, Ledger, More)
- Icon + label
- Active: `brand-500` icon + text
- Inactive: `neutral-500`
- Height: 60px + safe area inset
- Background: white, top border 1px `neutral-300`

**"More" tab** opens a drawer with: Labour, Expenses, Settings.

**Top App Bar**
- Height: 56px
- Title: `text-heading-2`
- Back button on detail screens
- Optional action icon on right (filter, etc.)
- Background: white
- Bottom border: 1px `neutral-100`

---

### Status Badges / Tags

```
● Paid       — success-500 bg: success-100
● Partial    — warning-500 bg: warning-100
● Unpaid     — danger-500  bg: danger-100
● Voided     — neutral-500 bg: neutral-100
● Advance    — info-500    bg: info-100
```

Badge: `text-label`, border-radius `radius-full`, padding `2px 8px`.

---

### Skeleton Loaders

- Use animated shimmer (left-to-right gradient sweep)
- Colour: `neutral-100` → `neutral-200`
- Match the exact shape and size of the content they replace
- Show skeletons for cards, list rows, and numerical summary values
- Never show a generic spinner as the primary loading state
- Animation: `1.5s ease-in-out infinite`

---

### Empty States

- Centred vertically in the content area
- Icon: 64px, `neutral-300` (line-art style, no filled icons)
- Heading: `text-heading-3`, `neutral-700`
- Sub-text: `text-body`, `neutral-500`
- CTA button: Primary button, 200px max-width

---

### Toast Notifications

- Bottom of screen, 16px from edge
- Max width: 90vw
- Border radius: `radius-md`
- Shadow: `shadow-md`
- Types: success (green left border), error (red left border), info (blue left border)
- Auto-dismiss: 3 seconds for success, 5 seconds for error
- Never block the FAB

---

## Responsive Rules

**MVP target:** Mobile-only. Design for 360px–414px width.

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile (primary) | 360–414px | Single-column, full-width cards |
| Large mobile | 415–600px | Same layout, more comfortable spacing |
| Tablet (future) | 600px+ | Two-column grid for dashboard cards |

**Safe areas:** Always add `env(safe-area-inset-bottom)` padding to bottom nav and FAB for notched phones.

---

## Animation Guidance

**General rule:** Fast, purposeful, subtle. No animations for their own sake.

| Event | Animation |
|---|---|
| Page transition | Slide-in from right (200ms, ease-out) |
| Bottom sheet open | Slide-up (250ms, ease-out) |
| Bottom sheet close | Slide-down (200ms, ease-in) |
| Card appear | Fade-in (150ms) |
| FAB tap | Scale down 0.95 → 1.0 (100ms) |
| Toast appear | Slide-up from bottom (200ms) |
| Number update | Count-up animation for dashboard figures (400ms) |
| Skeleton → content | Fade from skeleton to content (200ms) |

**Reduce motion:** Respect `prefers-reduced-motion`. Disable all transitions when set.

---

## Iconography

**Icon library:** Lucide Icons (already available in the React stack via `lucide-react`).

**Size:** 20px default, 24px for navigation, 16px for inline/compact.

**Colour:** Inherit from parent text colour unless semantic.

**Key icons used:**
| Icon | Usage |
|---|---|
| `Egg` | Egg production, stock |
| `ShoppingCart` | Sales |
| `Users` | Customers |
| `Wallet` | Cash book |
| `User` | Labourer |
| `Receipt` | Expenses |
| `LayoutDashboard` | Dashboard |
| `Plus` | Add / FAB |
| `ChevronRight` | List row navigation |
| `AlertCircle` | Warning / error |
| `CheckCircle2` | Success / paid |
| `Clock` | Partial / pending |
| `Banknote` | Money in |
| `ArrowUpRight` | Cash out |
| `ArrowDownLeft` | Cash in |
