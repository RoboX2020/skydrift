/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'display': ['Orbitron', 'sans-serif'],
      },
      colors: {
        'hud': {
          'primary': '#00ff88',
          'secondary': '#00ccff',
          'warning': '#ffcc00',
          'danger': '#ff4444',
          'bg': 'rgba(0, 20, 30, 0.8)',
        },
      },
    },
  },
  plugins: [],
}
