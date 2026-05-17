// Run: node scripts/generate-icons.mjs
// Generates icon-192.png and icon-512.png from the SVG using sharp (if available)
// Falls back to writing placeholder PNGs that browsers accept

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const svgContent = readFileSync('./public/icon.svg', 'utf8')

async function generate() {
  try {
    const sharp = require('sharp')
    const svgBuf = Buffer.from(svgContent)
    await sharp(svgBuf).resize(192, 192).png().toFile('./public/icon-192.png')
    await sharp(svgBuf).resize(512, 512).png().toFile('./public/icon-512.png')
    console.log('✓ Generated icon-192.png and icon-512.png with sharp')
  } catch {
    console.log('sharp not available — creating minimal valid PNGs')
    // Minimal 1x1 blue PNG, base64
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    if (!existsSync('./public/icon-192.png')) writeFileSync('./public/icon-192.png', png1x1)
    if (!existsSync('./public/icon-512.png')) writeFileSync('./public/icon-512.png', png1x1)
    console.log('✓ Created placeholder PNGs (install sharp for real icons: npm i -D sharp)')
  }
}

generate()
