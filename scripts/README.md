# Scripts

## convert-images-to-webp.js

Converts collection logo images (PNG, AVIF, etc.) to WebP format for better performance and smaller file sizes.

### Usage

**Convert all collections:**
```bash
npm run convert-logos
```

**Convert a specific collection:**
```bash
node scripts/convert-images-to-webp.js "DecentraGuild"
node scripts/convert-images-to-webp.js "Star Atlas"
```

### Features

- Converts PNG, AVIF, JPEG, TIFF to WebP
- Skips files that are already WebP
- Shows file size savings
- Processes single collection or all collections
- High quality output (90% quality, effort level 6)

### Notes

- The script only converts images, it does NOT update JSON files
- Make sure to update collection JSON files to reference `.webp` files after conversion
- Original files are preserved (not deleted)
- WebP files are created alongside original files

### Example Output

```
🖼️  Collection Logo Converter (PNG/AVIF → WebP)
══════════════════════════════════════════════════

📁 Processing collection: DecentraGuild
──────────────────────────────────────────────────
Converting: dguild-logo.png (45.23 KB)
  ✓ Created: dguild-logo.webp (12.45 KB, 72.5% smaller)

✓ Completed: 1 converted, 0 skipped
```
