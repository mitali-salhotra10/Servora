/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        servora: {
          dark: '#0F172A',
          navy: '#1E293B',
          primary: '#1E40AF',
          primaryHover: '#1D4ED8',
          accent: '#2563EB',
          compliant: '#059669',
          warning: '#D97706',
          danger: '#DC2626',
        }
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [],
}
