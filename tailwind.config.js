/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
        sans: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        omni: {
          green: '#39FF14',
          dark: '#050807',
          panel: 'rgba(8, 16, 12, 0.78)',
          red: '#FF2A2A',
          amber: '#FFB000',
          cyan: '#00F0FF'
        }
      }
    },
  },
  plugins: [],
}
