# Munchy — Design System ("Vibe & Velocity")

Source spec: `Design/vibe_velocity/DESIGN.md`. This file turns it into enforceable tokens, scales, components, and migration tasks.
Style: dark, glassmorphic minimalism. Food video is the hero. Accents: coral red (primary), electric yellow (secondary).

## 1. Audit findings
Measured on `frontend/src` (CSS modules + JSX).

| Finding | Evidence | Impact |
|---------|----------|--------|
| Color tokens mostly followed | 23 raw hex values total: `#fff` ×16, `#000` ×6, `#0a0a0a` ×1 | Low. Replace with tokens |
| Undefined CSS variables used | `--accent`, `--bg-secondary` not defined in `index.css` | Broken styles. Resolves to nothing |
| No radius scale | 11 different values: 9999px ×42, 50% ×27, 14px ×17, 10px ×14, 16px ×13, 12px ×9, 8px ×5, 2px ×4, 6px, 3px, 20px | Inconsistent corners |
| No type scale | 14 font sizes: 14px ×52, 13px ×38, 12px ×28, 15px ×21, 16px ×18, 11px ×15, 18px ×13, 24, 20, 22, 10, 17, 28, 32 | Uneven hierarchy |
| No spacing tokens | Raw px everywhere | Rhythm drifts |
| Spec and code token names differ | Spec uses `on-surface`, `surface-container-*`; code uses `--text`, `--surface-high` | Hard to map design to code |
| Inline styles | Partner pages: StoreManage 9, Dashboard 8, Analytics 5, PartnerProfile 3, PartnerOrders 3; user pages: StorePage 2, ReelsPage 2 | Bypass tokens. Partner area looks different |
| Native dialogs | 7 `alert()`/`confirm()` calls | Off-brand UX |
| Contrast failures | `--text-muted` #5b403e: 1.99:1 on bg, 1.78:1 on surface, used 35 times. White on #ff5352: 3.18:1. `--on-primary` #68000b on red: 4.15:1 | Fails WCAG AA for normal text |
| No focus styles or reduced-motion rule | none in `index.css` | Accessibility gap |

Healthy: `--text-dim` #ab8986 is 5.89:1 on bg and 5.28:1 on surface. Body text #e5e2e1 is 14.42:1. Coral on bg is 5.85:1.

## 2. Tokens
Create `frontend/src/styles/tokens.css`. Import it first in `main.jsx`. Keep legacy names as aliases so no sweeping rename is needed. Remove aliases at the end of UI-08.

```css
:root {
  color-scheme: dark;

  /* Surfaces (spec names) */
  --surface: #131313;
  --surface-lowest: #0e0e0e;
  --surface-low: #1c1b1b;
  --surface-container: #201f1f;
  --surface-high: #2a2a2a;
  --surface-highest: #353534;
  --surface-slate: #1e1e1e;

  /* Text */
  --on-surface: #e5e2e1;
  --on-surface-variant: #ab8986;   /* readable secondary text, 5.28:1 on slate */
  --text-disabled: #5b403e;        /* disabled and decorative only. Never for readable text */

  /* Brand */
  --primary: #ffb3ae;
  --primary-container: #ff5352;
  --on-primary-container: #410004; /* 5.39:1 on primary-container */
  --secondary: #ffdb3c;
  --on-secondary: #131313;         /* 13.67:1 on secondary */
  --tertiary: #60dac4;

  /* Status */
  --success: #00c853;
  --error: #ff3d00;
  --error-soft: #ffb4ab;

  /* Lines and glass */
  --outline: #ab8986;
  --outline-variant: #5b403e;
  --glass-bg: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.12);
  --scrim: rgba(0, 0, 0, 0.55);
  --white: #ffffff;                /* icons on video overlays only */

  /* Spacing (4 px base) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Type */
  --font-display: 'Montserrat', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --fs-label: 12px;     --lh-label: 16px;
  --fs-body-sm: 14px;   --lh-body-sm: 20px;
  --fs-body: 16px;      --lh-body: 24px;
  --fs-price: 18px;     --lh-price: 24px;
  --fs-title: 20px;     --lh-title: 28px;
  --fs-headline: 24px;  --lh-headline: 32px;   /* mobile */
  --fs-headline-lg: 32px; --lh-headline-lg: 40px;
  --fs-display: 48px;   --lh-display: 56px;

  /* Elevation */
  --shadow-1: 0 1px 2px rgba(0,0,0,.4);
  --shadow-2: 0 6px 20px rgba(0,0,0,.45);
  --shadow-glow: 0 0 24px rgba(255, 83, 82, .35);

  /* Motion */
  --ease: cubic-bezier(.2, .8, .2, 1);
  --dur-fast: 120ms;
  --dur: 200ms;
  --dur-slow: 320ms;

  /* Layers */
  --z-nav: 20; --z-sheet: 40; --z-modal: 50; --z-toast: 60;

  /* Layout */
  --gutter: 16px;
  --nav-h: 64px;
  --max-content: 1120px;

  /* ---- Legacy aliases (remove in UI-08) ---- */
  --bg: var(--surface);
  --surface-alias: var(--surface-slate);
  --text: var(--on-surface);
  --text-dim: var(--on-surface-variant);
  --text-muted: var(--on-surface-variant);   /* upgraded: was failing contrast */
  --primary-red: var(--primary-container);
  --yellow: var(--secondary);
  --yellow-dim: var(--secondary);
  --on-primary: var(--on-primary-container);
  --outline-dim: var(--outline-variant);
  --accent: var(--primary-container);        /* was undefined */
  --bg-secondary: var(--surface-slate);      /* was undefined */
}
```
Caveat on aliases: legacy `--surface` meant slate #1E1E1E and `--bg` meant #131313. In the new set `--surface` is #131313. Before applying, search every `var(--surface)` and decide: card backgrounds should become `var(--surface-slate)`. Do this in UI-02. Do not leave the alias collision in place.

## 3. Scales and migration maps

### Radius
| Old | New |
|-----|-----|
| 2px, 3px | `--radius-xs` |
| 6px, 8px | `--radius-sm` |
| 10px, 12px | `--radius-md` |
| 14px, 16px | `--radius-lg` |
| 20px (sheet top) | `--radius-xl` |
| 9999px | `--radius-full` |
| 50% | keep for true circles (avatars, dots) |

### Font size
| Old | New |
|-----|-----|
| 10px, 11px, 12px | `--fs-label` (uppercase + letter-spacing .05em where it is a label) |
| 13px, 14px | `--fs-body-sm` |
| 15px, 16px | `--fs-body` |
| 17px, 18px | `--fs-price` or `--fs-body` depending on role |
| 20px, 22px | `--fs-title` |
| 24px, 28px | `--fs-headline` |
| 32px | `--fs-headline-lg` |

Headings use `--font-display`. Body uses `--font-body`. Prices use display font, weight 700.

### Spacing
Map existing px to nearest token (4, 8, 12, 16, 20, 24, 32, 40, 48). Odd values (5, 6, 10, 14) round to nearest token.

## 4. Component primitives
Create in `frontend/src/components/ui/` with CSS modules. Each has props documented in a comment block. No inline styles.

| Component | Variants / notes |
|-----------|------------------|
| `Button` | `primary` (coral bg, `--on-primary-container` text), `secondary` (yellow), `ghost`, `glass`, `danger`. Sizes sm, md, lg. `loading` state. Min height 44px |
| `IconButton` | Requires `aria-label`. 44×44 hit area |
| `Card` | Slate bg, `--radius-lg`, 1px `--glass-border`. Optional `interactive` hover |
| `GlassPanel` | `--glass-bg` + `--glass-border`. `backdrop-filter` only on static overlays, never over scrolling video (see PERFORMANCE) |
| `Chip` | Filter chips, active state uses primary |
| `Badge` | `open`, `closed`, `status` colors, with text not color alone |
| `Input`, `Textarea`, `Select` | Label, hint, error. Focus ring |
| `Sheet` | Bottom sheet on mobile, centered modal on desktop. Focus trap. Esc closes |
| `ConfirmSheet` | Replaces `confirm()` |
| `Toast` + `useToast` | Replaces `alert()`. Auto-dismiss 3.5 s. `aria-live="polite"` |
| `Skeleton` | Shimmer, respects reduced motion |
| `EmptyState` | Icon, title, hint, optional action |
| `ErrorState` | Message + retry |
| `PageHeader` | Title, back, actions. Used by user and partner pages alike |
| `StatCard` | Partner dashboard numbers |
| `Price` | Formats INR from paise or rupees. One formatter for the app |

Shared helper: `lib/format.js` with `formatPrice`, `formatDistance`, `formatDuration`, `formatCount`.

## 5. Rules
1. Colors, spacing, radius, font sizes come from tokens only. A lint check (`grep`) in CI fails on `#[0-9a-f]{3,8}` in `*.module.css` outside `tokens.css`.
2. No `style={{}}` for static values. Dynamic values (map height, progress width) may use CSS custom properties set inline.
3. One primary action per screen region. Primary is coral.
4. Interactive targets ≥ 44×44 px.
5. Readable text must meet 4.5:1. `--text-disabled` is for disabled controls only.
6. Text on coral uses `--on-primary-container`. Never white on coral for normal text.
7. Every icon-only button has `aria-label`.
8. `:focus-visible` ring: 2px `--secondary`, offset 2px.
9. Motion uses `--ease` and `--dur-*`. Wrap non-essential animation in `@media (prefers-reduced-motion: no-preference)`.
10. Partner area uses the same primitives. Density can be higher, look cannot differ.

## 6. Layout
- Mobile first. Breakpoints: 480, 768, 1024.
- User app: bottom nav on mobile, side or top nav from 768 px.
- Partner app: same shell pattern with its own nav items.
- Content max width `--max-content`. Gutter `--gutter` (32px from 768).
- Reels feed: full viewport height using `100dvh`, snap scrolling.

## 7. Tasks

- [ ] **UI-01 (P1) Create tokens.** Add `styles/tokens.css` and `styles/base.css` (reset, body, headings, focus ring, reduced motion, scrollbar). Move content out of `index.css`. Keep aliases.
  Accept: app renders identically. `--accent` and `--bg-secondary` resolve. Build passes.

- [ ] **UI-02 (P1) Resolve `--surface` collision.** Search `var(--surface)` and `var(--bg)` usage. Card and panel backgrounds → `--surface-slate`. Page backgrounds → `--surface`. Update tokens so no ambiguous alias remains.
  Accept: visual diff shows no regressions on cards, headers, sheets.

- [ ] **UI-03 (P1) Contrast fixes.** Replace readable uses of old `--text-muted` with `--on-surface-variant`. Disabled and decorative uses → `--text-disabled`. Buttons on coral use `--on-primary-container`. Replace the 16 `#fff` and 6 `#000` raw values with `--white`, `--scrim`, or proper tokens.
  Accept: all body-size text ≥ 4.5:1 (check with browser devtools or axe).

- [ ] **UI-04 (P2) Radius, type, spacing migration.** Apply section 3 maps across all `*.module.css`. Work page by page. Visual check each.
  Accept: only token radii and font sizes remain (except `50%` circles).

- [ ] **UI-05 (P1) Build UI primitives.** Section 4 list. Include `Toast` and `ConfirmSheet` first.
  Accept: Storybook not required. Create a hidden `/__ui` route (dev only) showing all primitives.

- [ ] **UI-06 (P2) Replace dialogs.** Swap all 7 `alert()`/`confirm()` for `Toast` or `ConfirmSheet`.
  Accept: `grep -rn "alert(\|confirm(" frontend/src` returns nothing.

- [ ] **UI-07 (P2) Remove inline styles.** Partner pages first (StoreManage, Dashboard, Analytics, PartnerProfile, PartnerOrders), then StorePage, ReelsPage, PartnerReels. Move to modules using primitives.
  Accept: static inline styles gone.

- [ ] **UI-08 (P2) Adopt primitives across pages.** Buttons, inputs, cards, chips, badges, empty and error states, skeletons. Remove legacy aliases. Delete dead CSS.
  Accept: no legacy token names remain. CSS size not larger than baseline 60.79 kB.

- [ ] **UI-09 (P2) Shared shells.** `PageHeader` on every page. Same spacing and title treatment in user and partner layouts. Same nav component logic.
  Accept: partner and user screens look like one product.

- [ ] **UI-10 (P3) Accessibility pass.** Labels on all inputs. `aria-label` on icon buttons. Focus order. Sheet focus trap. Alt text on images (store and food names). Reduced motion.
  Accept: axe devtools shows no critical issues on login, reels, kitchens, checkout, partner dashboard.

- [ ] **UI-11 (P3) Brand polish.** Favicon, `theme-color` meta (`#131313`), social preview image, consistent logo lockup in header and auth pages.

- [ ] **UI-12 (P3) Lint guard.** Add a CI script that fails on raw hex in `*.module.css`, inline `style={{` with static colors, and `alert(`.
