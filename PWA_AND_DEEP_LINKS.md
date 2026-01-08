# PWA & Deep Links Implementation Guide

## What Was Implemented

### 1. Progressive Web App (PWA) ✅

**What is a PWA?**
A Progressive Web App is a web application that can be installed on a user's device and behaves like a native app. It's **NOT an APK file**, but it can be packaged as one if needed.

**Key Features:**
- ✅ Installable on home screen
- ✅ Works offline (with service worker)
- ✅ App-like experience (full screen, no browser UI)
- ✅ Fast loading (cached resources)
- ✅ Can be packaged as APK for Android app stores

**For Solana Mobile Dapp Store:**
- Your PWA can be submitted as a web app
- Can be packaged as APK using tools like:
  - [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (Google's tool)
  - [PWA Builder](https://www.pwabuilder.com/) (Microsoft's tool)
  - [Capacitor](https://capacitorjs.com/) (Ionic's tool)

---

### 2. Deep Links ✅

**What are Deep Links?**
Deep links are URLs that open specific content in your app, rather than just opening the home page.

**Examples:**
- `https://yourapp.com/escrow/ABC123` → Opens that specific escrow
- `https://yourapp.com/?escrow=ABC123` → Also opens that escrow
- `solana-mobile://yourapp.com/escrow/ABC123` → Solana Mobile deep link

**Why They're Important:**
- Users can share escrow links
- Clicking a link opens the exact escrow (not home page)
- Works from wallet apps, social media, etc.
- Essential for mobile dapp store

---

## Implementation Details

### PWA Configuration

**File: `vite.config.js`**
- Added `vite-plugin-pwa` plugin
- Configured manifest with app name, icons, theme colors
- Set up service worker for offline support
- Configured caching strategies

**Key Settings:**
```javascript
{
  name: 'dGuild Escrow',
  short_name: 'dGuild',
  theme_color: '#00d4ff',
  background_color: '#0a0a0f',
  display: 'standalone', // App-like experience
  icons: [...], // App icons
  start_url: '/', // Where app opens
}
```

**Service Worker:**
- Caches static assets (JS, CSS, images)
- Caches Google Fonts (1 year)
- Caches Solana RPC calls (5 minutes)
- Auto-updates when new version is available

---

### Deep Link Configuration

**File: `src/router/index.js`**
- Added `beforeEach` guard to handle deep links
- Supports multiple formats:
  1. **Direct path**: `/escrow/ABC123`
  2. **Query parameter**: `/?escrow=ABC123`
  3. **Solana Mobile**: `solana-mobile://yourapp.com/escrow/ABC123`

**How It Works:**
```javascript
// User clicks: https://yourapp.com/?escrow=ABC123
router.beforeEach((to, from, next) => {
  if (to.query.escrow) {
    // Redirects to: /escrow/ABC123
    next({ path: `/escrow/${to.query.escrow}` })
  }
})
```

---

## How to Use

### Installing the PWA

**On Mobile:**
1. Open your app in browser
2. Look for "Add to Home Screen" prompt
3. Or use browser menu → "Add to Home Screen"
4. App icon appears on home screen
5. Opens like a native app!

**On Desktop:**
1. Look for install icon in browser address bar
2. Click to install
3. App opens in its own window

---

### Testing Deep Links

**Test Direct Links:**
```
https://yourapp.com/escrow/ABC123
```

**Test Query Parameters:**
```
https://yourapp.com/?escrow=ABC123
```

**Test Share Functionality:**
1. Click "Share" on an escrow
2. Copy the link
3. Open in new tab/device
4. Should open directly to that escrow

---

## Building for Production

### Build Command
```bash
npm run build
```

This will:
- ✅ Generate PWA manifest
- ✅ Create service worker
- ✅ Optimize assets
- ✅ Generate icons

### Output Files
- `dist/manifest.webmanifest` - PWA manifest
- `dist/sw.js` - Service worker
- `dist/workbox-*.js` - Service worker helpers

---

## Packaging as APK (Optional)

### Option 1: Using Bubblewrap (Recommended)

1. **Install Bubblewrap:**
```bash
npm install -g @bubblewrap/cli
```

2. **Initialize:**
```bash
bubblewrap init --manifest https://yourapp.com/manifest.webmanifest
```

3. **Build APK:**
```bash
bubblewrap build
```

4. **Output:** `app-release-signed.apk`

### Option 2: Using PWA Builder

1. Go to https://www.pwabuilder.com/
2. Enter your app URL
3. Click "Build My PWA"
4. Download Android package
5. Get APK file

### Option 3: Using Capacitor

1. **Install Capacitor:**
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

2. **Initialize:**
```bash
npx cap init
npx cap add android
```

3. **Build:**
```bash
npm run build
npx cap sync
npx cap open android
```

4. **Build APK in Android Studio**

---

## Solana Mobile Dapp Store Submission

### Requirements Checklist

- [x] PWA manifest configured
- [x] Service worker for offline support
- [x] Deep link support
- [x] Mobile-optimized UI
- [x] App icons (192x192, 512x512)
- [x] Theme colors configured
- [ ] App screenshots (various sizes)
- [ ] App description
- [ ] Privacy policy URL
- [ ] Terms of service URL

### Submission Process

1. **Build your PWA:**
   ```bash
   npm run build
   ```

2. **Deploy to hosting:**
   - GitHub Pages (current)
   - Netlify
   - Vercel
   - Your own server

3. **Test PWA installation:**
   - Install on Android device
   - Test deep links
   - Test offline functionality

4. **Submit to Solana Mobile Dapp Store:**
   - Follow their submission guidelines
   - Provide app URL or APK
   - Include screenshots and description

---

## Troubleshooting

### PWA Not Installing?

**Check:**
1. App must be served over HTTPS (required for PWA)
2. Manifest must be valid
3. Service worker must be registered
4. Icons must be accessible

**Debug:**
- Open Chrome DevTools → Application tab
- Check "Manifest" section
- Check "Service Workers" section
- Look for errors

### Deep Links Not Working?

**Check:**
1. Router configuration is correct
2. URL format matches expected pattern
3. Escrow ID is valid
4. No console errors

**Debug:**
- Check browser console
- Check router navigation logs
- Test with different URL formats

### Service Worker Not Updating?

**Solution:**
- Clear browser cache
- Unregister old service worker
- Hard refresh (Ctrl+Shift+R)

---

## Files Modified

1. **`vite.config.js`** - Added PWA plugin configuration
2. **`index.html`** - Added PWA meta tags
3. **`src/router/index.js`** - Added deep link handling
4. **`package.json`** - Added vite-plugin-pwa dependency

---

## Next Steps

1. **Test PWA Installation:**
   - Build: `npm run build`
   - Serve: `npm run preview`
   - Test on mobile device

2. **Test Deep Links:**
   - Create an escrow
   - Share the link
   - Open in new tab/device
   - Verify it opens correctly

3. **Prepare for Submission:**
   - Create app screenshots
   - Write app description
   - Prepare privacy policy
   - Test on multiple devices

4. **Optional - Package as APK:**
   - Use Bubblewrap or PWA Builder
   - Test APK on Android device
   - Submit to app stores if desired

---

## Notes

- **PWA is NOT an APK** - It's a web app that can be installed
- **APK is optional** - You can submit PWA directly to Solana Mobile Dapp Store
- **Deep links work automatically** - No additional configuration needed
- **Service worker caches assets** - Faster loading on repeat visits
- **Offline support** - Basic offline functionality (shows cached content)

---

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Bubblewrap Guide](https://github.com/GoogleChromeLabs/bubblewrap)
- [PWA Builder](https://www.pwabuilder.com/)
- [Solana Mobile Dapp Store](https://solanamobile.com/)
