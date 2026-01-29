/**
 * Convert collection logos to WebP format
 * 
 * This script converts PNG, AVIF, and other image formats to WebP
 * for better performance and smaller file sizes.
 * 
 * Usage:
 *   node scripts/convert-images-to-webp.js [collection-folder]
 * 
 * If no folder is specified, it processes all collections in public/Collections/
 * 
 * Examples:
 *   node scripts/convert-images-to-webp.js "DecentraGuild"
 *   node scripts/convert-images-to-webp.js "Star Atlas"
 *   node scripts/convert-images-to-webp.js  (processes all)
 */

import sharp from 'sharp'
import { readdir, stat, readFile, writeFile } from 'fs/promises'
import { join, dirname, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const collectionsDir = join(rootDir, 'public', 'Collections')

// Supported input formats
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.avif', '.tiff', '.webp']

/**
 * Convert an image file to WebP format
 */
async function convertToWebP(inputPath, outputPath) {
  try {
    const stats = await stat(inputPath)
    console.log(`Converting: ${inputPath} (${(stats.size / 1024).toFixed(2)} KB)`)

    await sharp(inputPath)
      .webp({ 
        quality: 90, // High quality, can be adjusted
        effort: 6    // Compression effort (0-6, higher = better compression but slower)
      })
      .toFile(outputPath)

    const outputStats = await stat(outputPath)
    const savings = ((1 - outputStats.size / stats.size) * 100).toFixed(1)
    console.log(`  ✓ Created: ${outputPath} (${(outputStats.size / 1024).toFixed(2)} KB, ${savings}% smaller)`)
    
    return { success: true, savings }
  } catch (error) {
    console.error(`  ✗ Error converting ${inputPath}:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Find all image files in a directory
 */
async function findImageFiles(dir) {
  const files = await readdir(dir)
  const imageFiles = []

  for (const file of files) {
    const ext = extname(file).toLowerCase()
    if (SUPPORTED_FORMATS.includes(ext)) {
      const fullPath = join(dir, file)
      const stats = await stat(fullPath)
      if (stats.isFile()) {
        imageFiles.push(fullPath)
      }
    }
  }

  return imageFiles
}

/**
 * Process a single collection folder
 */
async function processCollection(collectionPath) {
  const collectionName = basename(collectionPath)
  console.log(`\n📁 Processing collection: ${collectionName}`)
  console.log('─'.repeat(50))

  const imageFiles = await findImageFiles(collectionPath)
  
  if (imageFiles.length === 0) {
    console.log(`  No image files found in ${collectionName}`)
    return { processed: 0, converted: 0 }
  }

  let converted = 0
  let skipped = 0

  for (const imagePath of imageFiles) {
    const ext = extname(imagePath).toLowerCase()
    
    // Skip if already WebP
    if (ext === '.webp') {
      console.log(`  ⊘ Skipping (already WebP): ${basename(imagePath)}`)
      skipped++
      continue
    }

    // Generate output path
    const baseName = basename(imagePath, ext)
    const outputPath = join(dirname(imagePath), `${baseName}.webp`)

    // Check if WebP already exists
    try {
      await stat(outputPath)
      console.log(`  ⊘ Skipping (WebP exists): ${basename(outputPath)}`)
      skipped++
      continue
    } catch {
      // File doesn't exist, proceed with conversion
    }

    const result = await convertToWebP(imagePath, outputPath)
    if (result.success) {
      converted++
    }
  }

  console.log(`\n✓ Completed: ${converted} converted, ${skipped} skipped`)
  return { processed: imageFiles.length, converted, skipped }
}

/**
 * Main function
 */
async function main() {
  const targetCollection = process.argv[2]

  console.log('🖼️  Collection Logo Converter (PNG/AVIF → WebP)')
  console.log('═'.repeat(50))

  try {
    if (targetCollection) {
      // Process single collection
      const collectionPath = join(collectionsDir, targetCollection)
      try {
        await stat(collectionPath)
        await processCollection(collectionPath)
      } catch (error) {
        console.error(`\n✗ Collection folder not found: ${targetCollection}`)
        console.error(`  Path: ${collectionPath}`)
        process.exit(1)
      }
    } else {
      // Process all collections
      const collections = await readdir(collectionsDir)
      let totalConverted = 0
      let totalSkipped = 0

      for (const collection of collections) {
        const collectionPath = join(collectionsDir, collection)
        const stats = await stat(collectionPath)
        
        if (stats.isDirectory()) {
          const result = await processCollection(collectionPath)
          totalConverted += result.converted
          totalSkipped += result.skipped
        }
      }

      console.log('\n' + '═'.repeat(50))
      console.log(`\n✨ All done!`)
      console.log(`   Converted: ${totalConverted} files`)
      console.log(`   Skipped: ${totalSkipped} files`)
    }
  } catch (error) {
    console.error('\n✗ Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
main()
