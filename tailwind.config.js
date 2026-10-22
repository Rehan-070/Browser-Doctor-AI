/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/dashboard/index.html",
    "./src/dashboard/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#09090b',
        darkCard: '#18181b',
        darkBorder: '#27272a',
        healthGreen: '#10b981',
        healthBlue: '#3b82f6',
        healthYellow: '#eab308',
        healthRed: '#ef4444',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
