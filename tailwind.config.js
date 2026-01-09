/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'primary-bg': 'var(--theme-bg-primary, #0a0a0f)',
        'secondary-bg': 'var(--theme-bg-secondary, #141420)',
        'card-bg': 'var(--theme-bg-card, #1a1a2e)',
        
        // Primary colors (green)
        'primary-color': 'var(--theme-primary, #00951a)',
        'primary-hover': 'var(--theme-primary-hover, #00b820)',
        'primary-light': 'var(--theme-primary-light, #00cc22)',
        'primary-dark': 'var(--theme-primary-dark, #007a14)',
        
        // Secondary colors (red - for links/accents)
        'secondary-color': 'var(--theme-secondary, #cf0000)',
        'secondary-hover': 'var(--theme-secondary-hover, #b30000)',
        'secondary-light': 'var(--theme-secondary-light, #ff3333)',
        'secondary-dark': 'var(--theme-secondary-dark, #990000)',
        
        // Accent colors
        'accent-color': 'var(--theme-accent, #8b5cf6)',
        'accent-hover': 'var(--theme-accent-hover, #7c3aed)',
        
        // Text colors
        'text-primary': 'var(--theme-text-primary, #ffffff)',
        'text-secondary': 'var(--theme-text-secondary, #a0a0b3)',
        'text-muted': 'var(--theme-text-muted, #6b6b80)',
        
        // Border colors
        'border-color': 'var(--theme-border, #2a2a3e)',
        'border-light': 'var(--theme-border-light, #3a3a4e)',
        
        // Status colors
        'status-success': 'var(--theme-success, #00951a)',
        'status-error': 'var(--theme-error, #cf0000)',
        'status-warning': 'var(--theme-warning, #ff6b35)',
        'status-info': 'var(--theme-info, #00d4ff)',
      },
      fontFamily: {
        'primary': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'var(--theme-gradient-primary, linear-gradient(135deg, #00951a 0%, #00cc22 50%, #007a14 100%))',
        'gradient-secondary': 'var(--theme-gradient-secondary, linear-gradient(135deg, #ff6b35 0%, #f59e0b 100%))',
        'gradient-accent': 'var(--theme-gradient-accent, linear-gradient(135deg, #00951a 0%, #cf0000 100%))',
      },
      boxShadow: {
        'glow': 'var(--theme-shadow-glow, 0 0 20px rgba(0, 149, 26, 0.3))',
        'glow-hover': 'var(--theme-shadow-glow-hover, 0 0 40px rgba(0, 149, 26, 0.6))',
        'card': 'var(--theme-shadow-card, 0 8px 32px rgba(0, 0, 0, 0.4))',
      },
      borderRadius: {
        'theme-sm': 'var(--theme-radius-sm, 0.5rem)',
        'theme-md': 'var(--theme-radius-md, 0.75rem)',
        'theme-lg': 'var(--theme-radius-lg, 1rem)',
        'theme-xl': 'var(--theme-radius-xl, 1.25rem)',
      },
    },
  },
  plugins: [],
}
