/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tokens de color exactos solicitados
        'sidebar-bg': '#191919',
        'canvas-bg': '#232323',
        'agent-panel-bg': '#1E1E1E',
        'query-box-bg': '#2E2E2E',
        'pill-bg': '#363636',
        'pill-hover': '#424242',
        'border-subtle': '#3D3D3D',
        'primary-blue': '#0F74DE',
        'primary-blue-hover': '#1A84F2',
        'brand-teal': '#14B8A6',
        'text-main': '#F3F4F6',
        'text-secondary': '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
