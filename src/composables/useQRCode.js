/**
 * Composable for QR code generation
 */

import { ref } from 'vue'

export function useQRCode() {
  const isGenerating = ref(false)

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
      await QRCode.toCanvas(canvas, text, {
        width: options.width || canvas.width || 200,
        margin: options.margin || 2,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF'
        },
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        ...options
      })
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
