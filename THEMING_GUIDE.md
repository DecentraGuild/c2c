# Theming and Customization Guide

This guide explains how to customize the visual appearance of your dApp, including colors, typography, spacing, border radius, and more.

## Overview

The dApp now has a comprehensive theming system that allows for dynamic customization of:
- **Colors** (backgrounds, text, borders, status, trade types)
- **Typography** (font sizes)
- **Spacing** (padding, margins, gaps)
- **Border Radius** (corner roundness)
- **Border Width** (thin, medium, thick)
- **Shadows** (glows, cards)
- **Gradients** (primary, secondary, accent)

All theme values are stored in CSS custom properties (variables) that can be customized per collection/marketplace.

---

## Theme Structure

### Location
- **Theme Store**: `src/stores/theme.js` - Contains the default theme and theme management logic
- **Theme Composable**: `src/composables/useTheme.js` - Easy access to theme properties
- **Tailwind Config**: `tailwind.config.js` - Maps theme variables to Tailwind classes
- **Global Styles**: `src/style.css` - CSS custom properties and base styles

---

## Customizing Your Theme

### 1. **Colors**

Colors are organized into categories:

```javascript
colors: {
  primary: {
    main: '#00951a',      // Main brand color
    hover: '#00b820',     // Hover state
    light: '#00cc22',     // Light variant
    dark: '#007a14',      // Dark variant
  },
  secondary: {
    main: '#cf0000',      // Secondary/accent color
    hover: '#b30000',
    light: '#ff3333',
    dark: '#990000',
  },
  background: {
    primary: '#0a0a0f',   // Main background
    secondary: '#141420', // Secondary background
    card: '#1a1a2e',      // Card backgrounds
  },
  text: {
    primary: '#ffffff',   // Main text
    secondary: '#a0a0b3', // Secondary text
    muted: '#6b6b80',     // Muted/disabled text
  },
  border: {
    default: '#2a2a3e',   // Standard borders
    light: '#3a3a4e',     // Lighter borders
  },
  trade: {
    buy: '#00ff00',       // Buy orders
    sell: '#ff0000',      // Sell orders
    trade: '#ffaa00',     // Trade/swap orders
  }
}
```

**To customize**: Edit these values in `src/stores/theme.js` in the `defaultTheme` object.

---

### 2. **Typography (Font Sizes)**

Font sizes scale from `xs` to `5xl`:

```javascript
fontSize: {
  xs: '0.75rem',      // 12px - Small labels, fine print
  sm: '0.875rem',     // 14px - Secondary text, descriptions
  base: '1rem',       // 16px - Body text
  lg: '1.125rem',     // 18px - Emphasized text
  xl: '1.25rem',      // 20px - Small headings
  '2xl': '1.5rem',    // 24px - Medium headings
  '3xl': '1.875rem',  // 30px - Large headings
  '4xl': '2.25rem',   // 36px - Hero text
  '5xl': '3rem',      // 48px - Extra large (rarely used)
}
```

**Usage in components**:
- Tailwind classes: `text-theme-xs`, `text-theme-sm`, `text-theme-base`, etc.
- Or use standard Tailwind: `text-xs`, `text-sm`, `text-base`, etc.

**Current optimized sizes**:
- **Hero headlines**: `text-2xl sm:text-3xl` (was `text-4xl sm:text-5xl lg:text-6xl`)
- **Page titles**: `text-lg sm:text-xl` (was `text-xl sm:text-2xl`)
- **Section headers**: `text-base sm:text-lg` (was `text-lg sm:text-xl`)
- **Body text**: `text-xs sm:text-sm` or `text-sm` (was `text-sm sm:text-base`)

---

### 3. **Spacing**

Spacing values for padding, margins, and gaps:

```javascript
spacing: {
  xs: '0.5rem',    // 8px - Tight spacing
  sm: '0.75rem',   // 12px - Small spacing
  md: '1rem',      // 16px - Medium spacing (default)
  lg: '1.5rem',    // 24px - Large spacing
  xl: '2rem',      // 32px - Extra large
  '2xl': '3rem',   // 48px - Very large
}
```

**Usage**:
- Tailwind classes: `p-theme-sm`, `m-theme-md`, `gap-theme-lg`, etc.
- Or use standard Tailwind: `p-2`, `m-4`, `gap-3`, etc.

**Current optimized spacing**:
- **Card padding**: `p-3` (was `p-4`)
- **Section spacing**: `space-y-3` to `space-y-6` (was `space-y-6` to `space-y-20`)
- **Grid gaps**: `gap-3 sm:gap-4` (was `gap-4 sm:gap-6`)

---

### 4. **Border Radius**

Control the roundness of corners:

```javascript
borderRadius: {
  sm: '0.5rem',   // 8px - Small radius
  md: '0.75rem',  // 12px - Medium radius
  lg: '1rem',     // 16px - Large radius (cards)
  xl: '1.25rem',  // 20px - Extra large
  full: '9999px', // Fully rounded (pills)
}
```

**Usage**:
- Tailwind classes: `rounded-theme-sm`, `rounded-theme-md`, `rounded-theme-lg`, etc.
- The `.card` class now uses `var(--theme-radius-lg)` by default

---

### 5. **Border Width**

```javascript
borderWidth: {
  thin: '1px',    // Subtle borders
  medium: '2px',  // Standard borders
  thick: '4px',   // Emphasized borders
}
```

---

## Loading Custom Themes

### From JSON File

You can load themes from JSON files (e.g., per collection):

```javascript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
await themeStore.loadThemeFromJson('/Collections/YourCollection/theme.json')
```

### From NFT Metadata (Future)

The system is prepared for loading themes from NFT metadata:

```javascript
await themeStore.loadThemeFromNFT(nftMetadata)
```

### Example Theme JSON

```json
{
  "id": "my-custom-theme",
  "name": "My Custom Theme",
  "colors": {
    "primary": {
      "main": "#ff6b35",
      "hover": "#ff8555"
    },
    "background": {
      "primary": "#1a1a2e",
      "card": "#2a2a3e"
    }
  },
  "fontSize": {
    "base": "1rem",
    "lg": "1.25rem"
  },
  "spacing": {
    "md": "1.5rem"
  },
  "borderRadius": {
    "lg": "1.5rem"
  },
  "branding": {
    "logo": "/path/to/logo.svg",
    "name": "My Marketplace"
  }
}
```

### Storefront JSON visual keys

Storefront configs (e.g. `public/Collections/YourStore/your-store.json`) are loaded by the storefront store. When a storefront is selected on marketplace/create/manage/escrow routes, `loadStorefrontTheme(storefront)` runs and passes the following into the theme store (all optional except id/name; missing keys fall back to default theme):

| Key | Purpose |
|-----|--------|
| `colors` | Full or partial color overrides (primary, secondary, accent, background, text, border, status, trade, window). |
| `logo` | Used for theme branding; NavBar and cards show this when storefront is selected. |
| `fontSize` | Optional. Same shape as theme (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl in rem). |
| `spacing` | Optional. Same shape as theme (xs, sm, md, lg, xl, 2xl in rem). |
| `borderRadius` | Optional. sm, md, lg, xl, full. |
| `borderWidth` | Optional. thin, medium, thick. |
| `shadows` | Optional. glow, glowHover, card. |
| `gradients` | Optional. primary, secondary, accent (CSS linear-gradient strings). |

You can add only the keys you want to tweak; the theme store merges with the default. Text/labels are not configurable via storefront JSON (platform copy remains fixed unless you opt for Custom UI/UX).

---

## Responsive Design Strategy

The dApp uses a mobile-first approach with responsive breakpoints:

- **Mobile** (default): Optimized for phones (320px+)
- **sm**: Small tablets (640px+)
- **md**: Tablets (768px+)
- **lg**: Laptops (1024px+)
- **xl**: Large screens (1280px+)

### Scaling Guidelines

**Text sizes** typically follow this pattern:
```html
<!-- Small to medium scaling -->
<h1 class="text-base sm:text-lg">Title</h1>

<!-- Medium to large scaling -->
<h1 class="text-lg sm:text-xl">Heading</h1>

<!-- Hero text (use sparingly) -->
<h1 class="text-2xl sm:text-3xl lg:text-4xl">Hero</h1>
```

**Spacing** follows similar patterns:
```html
<!-- Tight to comfortable -->
<div class="p-3 sm:p-4">...</div>

<!-- Comfortable to spacious -->
<div class="gap-3 sm:gap-4 lg:gap-6">...</div>
```

---

## Component-Specific Customization

### Cards (`.card` class)

The global card style is defined in `src/style.css`:

```css
.card {
  @apply bg-card-bg border border-border-color p-3 shadow-card;
  border-radius: var(--theme-radius-lg, 1rem);
}
```

This means all cards will automatically use:
- Theme background color
- Theme border color
- Theme border radius
- Consistent padding and shadow

### Navbar

The navbar height has been optimized:
- **Mobile**: `h-12` (was `h-14`)
- **Desktop**: `h-12` (was `h-14`)

Logo sizes:
- **Mobile**: `w-7 h-7` (was `w-8 h-8`)
- **Desktop**: `w-7 h-7` (was `w-8 h-8`)

### Buttons

Button styles are defined in `src/style.css`:
- `.btn-primary` - Primary action buttons (gradient background)
- `.btn-secondary` - Secondary buttons (outlined)
- `.btn-cancel` - Cancel/destructive actions (red)

All buttons have a minimum touch target of `44px` for mobile accessibility.

---

## Best Practices

1. **Use theme variables** instead of hardcoded colors:
   - ✅ `bg-primary-color` or `bg-card-bg`
   - ❌ `bg-green-500` or `bg-[#00951a]`

2. **Use responsive classes** for all sizing:
   - ✅ `text-base sm:text-lg`
   - ❌ `text-xl` (unless intentionally fixed)

3. **Keep spacing consistent**:
   - Use the theme spacing scale (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`)
   - Avoid arbitrary values like `p-[17px]`

4. **Test on multiple screen sizes**:
   - Mobile (375px - iPhone)
   - Tablet (768px)
   - Desktop (1440px)

5. **Border radius should be customizable**:
   - Use `rounded-theme-*` classes when possible
   - Or use CSS variables: `style="border-radius: var(--theme-radius-lg)"`

---

## Pages Optimized

All major pages have been optimized for better scaling:

1. **Dashboard (Explore)** - ✅ Hero text reduced, spacing tightened
2. **Marketplace** - ✅ Headers reduced, card grids optimized
3. **Create Escrow** - ✅ Form elements tightened, text sizes reduced
4. **Manage Escrows** - ✅ Card spacing optimized
5. **Onboard Collection** - ✅ Significant reduction in hero text and spacing

---

## Testing Changes

After making theme changes:

1. **Check all pages**:
   - Dashboard
   - Marketplace
   - Create/Manage Escrows
   - Onboard page

2. **Test responsive breakpoints**:
   - Use browser dev tools
   - Resize window from 320px to 1920px

3. **Verify dark mode** (if applicable):
   - All colors should work in dark theme

4. **Check accessibility**:
   - Text contrast ratios
   - Touch target sizes (min 44px)
   - Keyboard navigation

---

## Future Enhancements

The theme system is prepared for:
- ✅ Per-collection themes (already supported)
- ✅ JSON-based theme loading (already supported)
- 🔜 NFT-based theme loading (prepared, not implemented)
- 🔜 User theme preferences
- 🔜 Light/dark mode toggle
- 🔜 Admin UI for theme customization

---

## Need Help?

- Review `src/stores/theme.js` for the complete theme structure
- Check `src/composables/useTheme.js` for helper functions
- Look at component examples in `src/views/` for usage patterns
- CSS variables are defined in `src/style.css` (`:root` section)
