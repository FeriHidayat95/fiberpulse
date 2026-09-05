/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#152C4A',
          azure: '#42A1D3',
          blue: '#2563EB',
          ice: '#F1F7FC',
          border: '#E2EBF4',
          50: '#F0F7FC',
          100: '#E1F0F8',
          200: '#B8DCF0',
          300: '#7EC1E4',
          400: '#42A1D3',
          500: '#1E88C7',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#152C4A',
          900: '#0E1E33',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
