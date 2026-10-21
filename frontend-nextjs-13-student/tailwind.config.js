/** @type {import('tailwindcss').Config} */
const { nextui } = require("@nextui-org/react");

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    "./component/**/*.{js,ts,jsx,tsx}",
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'blink-green': {
          '0%, 100%': { backgroundColor: '#10B981' },
          '50%': { backgroundColor: '#34D399' },
        },
        // 👇 เพิ่ม fadeInUp
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'blink-green-once': 'blink-green 1s 4 forwards',
        // 👇 เพิ่ม fadeInUp
        fadeInUp: 'fadeInUp 0.4s ease-out',
      },
    },
  },
  darkMode: "class",
  plugins: [nextui(), require('daisyui')],
}
