---
name: Outreach Pilot
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#434655'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
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
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system for Outreach Pilot focuses on **High-Utility Minimalism**. It is engineered for a CRM environment where data density and clarity are paramount. The aesthetic is professional, systematic, and utilitarian, drawing heavily from modern SaaS patterns to ensure a zero-learning-curve experience for sales and outreach professionals. 

The emotional response should be one of reliability and efficiency. By utilizing a "clean-room" approach—heavy on white space, precise borders, and a singular functional accent color—the interface recedes to let the user's data and tasks take center stage.

## Colors
The palette is intentionally restrained to maintain high contrast and clear information hierarchy.
- **Surface**: The primary application background uses `#FAFAFA` to reduce eye strain compared to pure white, while cards and interactive containers use `#FFFFFF`.
- **Action**: Primary actions and active states exclusively use `#2563EB`.
- **Typography**: All primary text is `#1A1A1A` for maximum legibility.
- **Semantic States**: Specific hex codes are reserved for score badges and category tags to ensure color remains a meaningful data signal rather than just decoration.

## Typography
The system uses **Inter** exclusively to leverage its systematic, neutral character. 
- **Scale**: A tight typographic scale ensures consistency across dense data tables and lead profiles.
- **Weights**: Use `600` (Semi-bold) for headlines and `400` (Regular) for body copy.
- **Labels**: Small labels (12px) should use `500` weight with a slight positive letter-spacing to maintain readability in small UI footprints like badges and tags.

## Layout & Spacing
The design system utilizes a **12-column fluid grid** for desktop and a **single-column vertical stack** for mobile. 
- **Rhythm**: All spacing is derived from a 4px base unit. 
- **Margins**: Mobile layouts use a 16px side margin, while desktop applications scale to 32px or 48px depending on screen width.
- **Density**: In data-heavy views (Leads list), vertical spacing between rows should be compressed to `sm` (8px), whereas marketing or dashboard views use `md` (16px) or `lg` (24px) for better breathing room.

## Elevation & Depth
This design system uses a "Flat-Plus" approach. Depth is primarily communicated through subtle borders rather than heavy shadows.
- **Cards**: Use a `#FFFFFF` background with a `1px` solid border (`#E5E7EB`). A very soft, diffused shadow (`0px 2px 4px rgba(0,0,0,0.05)`) is applied to distinguish the card from the off-white background.
- **Floating Elements**: Modals and dropdowns use a slightly more pronounced shadow to indicate higher z-index placement.
- **Zero-Elevation**: Input fields and secondary containers are flat with borders only.

## Shapes
The shape language is modern and approachable without being overly playful.
- **Standard Radius**: 8px (`0.5rem`) for buttons and small containers.
- **Large Radius**: 16px (`1rem`) for primary content cards and modals.
- **Pill**: Score badges and category tags use a fully rounded (pill) radius to distinguish them as non-interactive or status-only elements.

## Components
- **Buttons**:
    - **Primary**: Solid `#2563EB` fill with white text. 
    - **Secondary**: `#FFFFFF` background, `1px` border (`#E5E7EB`), text `#1A1A1A`. 
    - *Note: Icon-only buttons are not permitted; all buttons must include a label.*
- **Score Badges**: Pill-shaped with a background opacity of 10% and a solid text color. Green (`#16A34A`), Yellow (`#CA8A04`), or Red (`#DC2626`). Formatting is strictly `X.X`.
- **Category Tags**: Small, uppercase or capitalized labels with color coding:
    - AI Video & Hiring: Indigo.
    - AEO/GEO: Teal.
    - AI Automation: Violet.
- **Input Fields**: 8px radius, `#E5E7EB` border, 14px text. Focus state uses a `1px` blue border and a soft blue outer glow.
- **Bottom Navigation**: High-contrast icons. The active state requires a filled icon, a visible text label, and a 3px blue horizontal indicator at the very top of the navigation item slot.
- **Cards**: Use the defined 16px radius and subtle shadow. Content inside should have 16px or 20px padding.