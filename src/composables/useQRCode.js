/**
 * Composable for QR code generation
 */

import { ref } from 'vue'

export function useQRCode() {
  const isGenerating = ref(false)

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  const generateQRCode = async (canvas, text, options = {}) => {
    if (!canvas || !text) {
      console.warn('QR Code generation: Missing canvas or text', { canvas: !!canvas, text: !!text })
      return false
    }

    // Ensure canvas has dimensions
    if (!canvas.width || !canvas.height) {
      const size = options.width || 200
      canvas.width = size
      canvas.height = size
    }

    isGenerating.value = true
    try {
      // Try to use qrcode library if available
      const QRCode = (await import('qrcode')).default
      
      // Always use 'H' (High) error correction for escrow links to ensure maximum reliability
      // This provides ~30% error resistance, allowing the code to be read even if:
      // - Logo obscures part of the pattern (error correction reconstructs the data)
      // - Code is slightly damaged or dirty
      // - Scanning conditions are poor
      // Higher error correction = larger QR code, but worth it for financial transactions
      const errorCorrectionLevel = options.errorCorrectionLevel || 'H'
      
      await QRCode.toCanvas(canvas, text, {
        width: options.width || canvas.width || 200,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel,
        ...options
      })

      // Add logo if provided
      if (options.logo) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          try {
            const logoSize = options.logoSize || Math.floor(canvas.width * 0.2) // 20% of QR code size
            const logoPadding = options.logoPadding || Math.floor(logoSize * 0.15) // 15% padding around logo
            const logoWithPadding = logoSize + (logoPadding * 2)
            const centerX = canvas.width / 2
            const centerY = canvas.height / 2

            // Load logo image
            const logoImg = await loadImage(options.logo)
            
            // Draw white background with rounded corners for logo
            ctx.fillStyle = options.lightColor || '#FFFFFF'
            const cornerRadius = options.logoCornerRadius || logoWithPadding * 0.2
            drawRoundedRect(
              ctx,
              centerX - logoWithPadding / 2,
              centerY - logoWithPadding / 2,
              logoWithPadding,
              logoWithPadding,
              cornerRadius
            )
            ctx.fill()

            // Draw logo in center
            ctx.drawImage(
              logoImg,
              centerX - logoSize / 2,
              centerY - logoSize / 2,
              logoSize,
              logoSize
            )
          } catch (logoError) {
            console.warn('Failed to add logo to QR code:', logoError)
            // Continue without logo if it fails
          }
        }
      }

      return true
    } catch (importError) {
      console.error('Failed to import qrcode library:', importError)
      // Fallback to simple placeholder if library not available
      try {
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          console.error('Failed to get canvas context')
          return false
        }
        ctx.fillStyle = options.lightColor || '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = options.darkColor || '#000000'
        ctx.font = '12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('QR Code', canvas.width / 2, canvas.height / 2 - 10)
        ctx.fillText('(Library not available)', canvas.width / 2, canvas.height / 2 + 10)
        return false
      } catch (error) {
        console.error('Failed to generate QR code fallback:', error)
        return false
      }
    } finally {
      isGenerating.value = false
    }
  }

  return {
    isGenerating,
    generateQRCode
  }
}
