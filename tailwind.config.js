/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false, // NHS UK frontend provides its own reset
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
