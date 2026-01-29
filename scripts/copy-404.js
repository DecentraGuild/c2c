/**
 * Post-build script for GitHub Pages deployment
 * 
 * Copies index.html to 404.html to enable client-side routing
 * This allows Vue Router to handle all routes properly on GitHub Pages
 */

import { copyFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const distDir = resolve(__dirname, '../dist')
const indexPath = resolve(distDir, 'index.html')
const notFoundPath = resolve(distDir, '404.html')

try {
  // Check if dist/index.html exists
  if (!existsSync(indexPath)) {
    console.error('❌ Error: dist/index.html not found')
    console.error('   Make sure vite build has completed successfully')
    process.exit(1)
  }

  // Copy index.html to 404.html for GitHub Pages client-side routing
  copyFileSync(indexPath, notFoundPath)
  console.log('✅ Created 404.html from index.html for GitHub Pages')
  console.log('   This enables client-side routing on GitHub Pages')
} catch (error) {
  console.error('❌ Error copying index.html to 404.html:', error.message)
  process.exit(1)
}
