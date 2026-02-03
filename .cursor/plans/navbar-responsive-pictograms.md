# Plan: Navbar responsive pictograms

**Target:** `src/components/NavBar.vue`

---

## Current code (baseline)

- **Breakpoint:** Compact layout uses `md:hidden` / `hidden md:flex` (768px).
- **Compact (&lt; md):** One bar for all contexts: logo left, wallet + hamburger right. No nav items on the bar; everything (storefront selector, Explore, Host, Marketplace, Create, Manage) is inside the hamburger menu.
- **Full (md+):** Two layers already separate in code:
  - **Platform** (`isPlatformRoute || !selectedStorefrontId`): logo, Explore, Host (text only), Wallet.
  - **Storefront** (`selectedStorefrontId && isCollectionRoute`): storefront logo + selector, Marketplace, Create, Manage (text only), Wallet.
  - **Fallback** (storefront selected, non-storefront route): platform bar (Explore, Host, Wallet).
- No icons on any nav links; hamburger uses `mdi:menu` / `mdi:close`.

---

## Changes only

### 1. Breakpoint: `md` → `lg`

- Use `lg` (1024px) for compact vs full bar.
- Replace compact visibility: e.g. `md:hidden` → `lg:hidden`, `hidden md:flex` → `hidden lg:flex` so the “mobile” layout applies below 1024px and the “desktop” layout at 1024px and up.

### 2. Compact bar (&lt; lg): layer-specific icon row

**Platform context (Layer 1):**

- Bar: `[Full logo] [Explore icon] [Host icon] [Wallet icon] [Hamburger icon]`.
- Add two `<router-link>` icon buttons (Explore, Host) and keep Wallet + hamburger. Same full logo. Square icon buttons (e.g. 40x40 or 44x44), no labels. `aria-label` on each.
- Hamburger menu: keep current content (storefront selector, then Explore/Host, then Marketplace/Create/Manage). Add icons next to each menu item label.

**Storefront context (Layer 2):**

- Bar: `[Full logo] [Marketplace icon] [Create icon] [Manage icon] [Wallet icon] [Hamburger icon]`.
- Do **not** show storefront selector or storefront logo on the bar in compact mode; show only the five icons. Storefront selector moves into the hamburger (already present in current menu).
- Add three `<router-link>` icon buttons (Marketplace, Create, Manage) + Wallet + hamburger. Square icon buttons, no labels. `aria-label` on each.
- Hamburger menu: same structure (selector, Platform, Storefront), add icons next to labels.

**Shared:**

- Full logo only (no storefront logo on bar when compact).
- Wallet: use WalletMultiButton if it can be styled as a square icon-only button; otherwise use a custom icon button (e.g. `mdi:wallet-outline`) that triggers the same wallet UI.
- Active state on icon buttons (e.g. `isActive(...)` with background or border).

### 3. Full bar (lg+): add pictograms to existing links

- **Platform blocks** (main platform + fallback): add an `<Icon>` before the text “Explore” and “Host” on each link. Same routes and classes.
- **Storefront block:** add an `<Icon>` before “Marketplace”, “Create”, “Manage”. Wallet: keep WalletMultiButton; if it supports a compact/icon mode, use it for consistency; otherwise leave as-is or add wrapper icon.
- No change to layout or visibility logic; only add icons to existing links.

### 4. Hamburger menu: icons next to labels

- In the single slide-down menu (used in compact only), add an `<Icon>` next to each of: Explore, Host, Marketplace, Create, Manage (and keep Storefront selector as-is).

### 5. Accessibility

- Every icon-only button on the compact bar must have an `aria-label` (e.g. “Explore”, “Host”, “Marketplace”, “Create”, “Manage”, “Wallet”, “Menu”).

---

## Icon set (Iconify)

| Item        | Icon (suggestion)         |
|-------------|---------------------------|
| Marketplace | `mdi:storefront-outline` |
| Create      | `mdi:plus-circle-outline` |
| Manage      | `mdi:format-list-bulleted` |
| Wallet      | WalletMultiButton or `mdi:wallet-outline` |
| Explore     | `mdi:compass-outline` or `mdi:earth` |
| Host        | `mdi:domain` or `mdi:store-check-outline` |
| Hamburger   | `mdi:menu` / `mdi:close` (existing) |

---

## Files to touch

- `src/components/NavBar.vue` only (template + script; no new composables needed).
