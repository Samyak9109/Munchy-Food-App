---
name: Vibe & Velocity
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e4beba'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#ab8986'
  outline-variant: '#5b403e'
  surface-tint: '#ffb3ae'
  primary: '#ffb3ae'
  on-primary: '#68000b'
  primary-container: '#ff5352'
  on-primary-container: '#5c0008'
  inverse-primary: '#ba1724'
  secondary: '#fff9ef'
  on-secondary: '#3a3000'
  secondary-container: '#ffdb3c'
  on-secondary-container: '#725f00'
  tertiary: '#60dac4'
  on-tertiary: '#003730'
  tertiary-container: '#0ba38f'
  on-tertiary-container: '#003029'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ae'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930014'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#7ef7e0'
  tertiary-fixed-dim: '#60dac4'
  on-tertiary-fixed: '#00201b'
  on-tertiary-fixed-variant: '#005046'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  surface-slate: '#1E1E1E'
  glass-border: rgba(255, 255, 255, 0.12)
  status-success: '#00C853'
  status-error: '#FF3D00'
typography:
  display-xl:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  price-display:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is engineered for high-energy food discovery, blending the addictive nature of social media scrolling with the utility of a logistics platform. It targets a Gen-Z and Millennial audience that eats with their eyes first.

The primary design style is **Glassmorphic Minimalism**. By utilizing deep, dark backgrounds, the interface recedes to let vibrant, high-definition food reels become the hero. Translucent UI overlays provide context without breaking the immersion of the video content. The aesthetic is "premium-street"—bold, fast, and undeniably modern.

Key visual principles:
- **Immersive Depth:** Use of blurred backgrounds and frosted glass containers to keep the user focused on the active video layer.
- **Kinetic Energy:** High-contrast accents (Electric Yellow) suggest speed and AI-driven intelligence.
- **Social-First:** Heavy use of rounded corners and large touch targets to mimic established social patterns.

## Colors

The palette is optimized for OLED displays and high-motion video environments. 

- **Munchy Red (#FF4D4D):** The core brand driver. Used for primary actions, branding, and highlighting "Crave-worthy" moments.
- **Electric Yellow (#FFD700):** A high-visibility accent reserved for AI features, CTA buttons within reels, and the "Self-Pickup" OTP verification flow.
- **Deep Charcoal (#121212):** The base canvas. It ensures zero glare and maximum contrast for food videography.
- **Slate (#1E1E1E):** Used for elevated surface layers, such as card containers and persistent bottom sheets.

For Glassmorphism, use white at 10% opacity for fills and 20% opacity for borders to create the "frosted" effect over moving video.

## Typography

The typography system balances the expressive personality of **Montserrat** for headlines with the functional clarity of **Inter** for data-heavy components like menus and checkout.

- **Headlines:** Use Montserrat with tight letter spacing for a compact, punchy feel. Headlines should always be high-contrast against the dark background.
- **Body & Metadata:** Inter is used for descriptions and technical details. 
- **The OTP Code:** For verification screens, use a monospaced variant or Inter with increased letter spacing to ensure maximum legibility during the physical pickup handoff.
- **Video Overlays:** Any text appearing directly over video must utilize a subtle text-shadow or a glassmorphic background plate to maintain readability.

## Layout & Spacing

This design system utilizes a **Mobile-First Fluid Grid** with a focus on edge-to-edge content. 

- **Reel View:** Vertical 9:16 aspect ratio. Navigation and engagement icons are pinned to the right safe area (16px margin). Captions and food titles are anchored to the bottom-left.
- **Grid System:** On mobile, a 2-column or 1-column layout is standard. On desktop, the grid expands to a 12-column system, but content is capped at a 1200px container to maintain focus.
- **Spacing Rhythm:** Based on a 4px baseline. Most components use 16px (stack-md) for internal padding to maintain a spacious, breathable feel despite the dark theme.

## Elevation & Depth

In this dark-mode, video-centric environment, traditional shadows are replaced by **Tonal Layering** and **Luminance Overlays**.

1.  **Level 0 (Base):** Deep Charcoal (#121212). The infinite background.
2.  **Level 1 (Surface):** Slate (#1E1E1E). Used for cards, navigation bars, and persistent elements.
3.  **Level 2 (Glass):** Frosted overlays (Backdrop-filter: blur(12px)). Used for floating action menus, snackbars, and interactive tags that sit directly on top of videos.
4.  **Level 3 (Pop):** Primary Munchy Red or Electric Yellow elements. These use a "Neon Glow" (shadow with a colored tint, 20% opacity) to appear as if they are emitting light onto the dark surfaces below.

## Shapes

The shape language is "Full-Rounded," emphasizing comfort and modern app aesthetics.

- **Primary Containers:** 16px (rounded-lg) for cards and bottom sheets.
- **Interactive Elements:** Buttons and input fields use 1.5rem (rounded-xl) or full pill-shapes for a friendly, approachable feel.
- **Indicators:** Self-Pickup tags and AI chips should always be fully pill-shaped to distinguish them from functional rectangular buttons.
- **Borders:** Subtle 1px borders are used on glass components to define edges where shadows are ineffective.

## Components

### Buttons & CTAs
- **Primary:** Munchy Red background with white text. High-gloss finish.
- **AI/Pickup:** Electric Yellow background with black text. Reserved for the "Quick-AI Chat" and "Confirm Pickup" actions.
- **Glass Action:** Translucent buttons for "Like," "Share," and "Comment" over video feeds.

### Chips & Tags
- **Self-Pickup:** Always Electric Yellow with a "Map Pin" icon.
- **Food Categories:** Slate background with Inter-bold labels.

### Cards
- **Food Card:** 16px corner radius. High-quality thumbnail (or auto-playing video). Title and Price in Montserrat.
- **Store Card:** Includes a "Distance" badge and "Availability" toggle for partners.

### Inputs
- Rounded-xl (pill) shape. 1px border (#FFFFFF 10%). On focus, the border transitions to Munchy Red with a subtle outer glow.

### The Pickup OTP
- Six distinct high-contrast boxes with Montserrat Bold typography. The active box is highlighted with an Electric Yellow underline.

### AI Chat Interface
- Floating "Munchy Bot" glass bubble. Chat bubbles use Slate (User) and Munchy Red (AI) with heavy blurring for the container background.