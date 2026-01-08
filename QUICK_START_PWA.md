# Quick Start: PWA & Deep Links

## ✅ What's Done

### PWA (Progressive Web App)
- ✅ Installed `vite-plugin-pwa`
- ✅ Configured manifest (name, icons, colors)
- ✅ Set up service worker (offline support, caching)
- ✅ Added PWA meta tags to HTML

### Deep Links
- ✅ Router handles `/escrow/:id` URLs
- ✅ Router handles `/?escrow=ABC123` query params
- ✅ Router handles Solana Mobile deep links
- ✅ Share functionality already works

---

## 🚀 How to Test

### 1. Build the App
```bash
npm run build
```

### 2. Preview (Local Testing)
```bash
npm run preview
```

### 3. Test PWA Installation
1. Open `http://localhost:4173` in Chrome/Edge
2. Look for install icon in address bar
3. Click "Install"
4. App opens in its own window!

### 4. Test Deep Links
1. Create an escrow
2. Copy the escrow URL: `http://localhost:4173/escrow/ABC123`
3. Open in new tab
4. Should open directly to that escrow ✅

---

## 📱 Mobile Testing

### On Android:
1. Build and deploy to your hosting
2. Open in Chrome on Android
3. Menu → "Add to Home Screen"
4. App icon appears on home screen
5. Opens like native app!

### On iOS:
1. Open in Safari
2. Share button → "Add to Home Screen"
3. App icon appears
4. Opens in standalone mode

---

## 🔗 Deep Link Formats Supported

All of these work:
- `https://yourapp.com/escrow/ABC123` ✅
- `https://yourapp.com/?escrow=ABC123` ✅
- `solana-mobile://yourapp.com/escrow/ABC123` ✅

---

## 📦 Packaging as APK (Optional)

### Quick Method - PWA Builder:
1. Go to https://www.pwabuilder.com/
2. Enter your deployed app URL
3. Click "Build My PWA"
4. Download Android package
5. Get APK file!

### Advanced Method - Bubblewrap:
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://yourapp.com/manifest.webmanifest
bubblewrap build
```

---

## ⚠️ Important Notes

1. **PWA requires HTTPS** - Must deploy to HTTPS server (GitHub Pages works!)
2. **Service worker only in production** - Disabled in dev mode for faster development
3. **Icons** - Using `dguild-logo.png` (you may want to create proper 192x192 and 512x512 icons)
4. **Deep links work automatically** - No extra code needed!

---

## 🎯 Next Steps

1. **Deploy to production** (GitHub Pages, Netlify, etc.)
2. **Test on real mobile device**
3. **Create proper app icons** (192x192, 512x512)
4. **Test PWA installation**
5. **Submit to Solana Mobile Dapp Store**

---

## 📚 Full Documentation

See `PWA_AND_DEEP_LINKS.md` for complete details!
