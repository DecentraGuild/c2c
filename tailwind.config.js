/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#0a0a0f',
        'secondary-bg': '#141420',
        'card-bg': '#1a1a2e',
        'primary-color': '#00d4ff',
        'primary-hover': '#00b8e6',
        'accent-color': '#8b5cf6',
        'accent-secondary': '#ff6b35',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0b3',
        'text-muted': '#6b6b80',
        'border-color': '#2a2a3e',
      },
      fontFamily: {
        'primary': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #ff6b35 0%, #f59e0b 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-hover': '0 0 40px rgba(0, 212, 255, 0.6)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
