/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'DM Serif Display'", 'serif'],
        sans: ["'DM Sans'", 'sans-serif'],
      },
      colors: {
        primary: '#1E3A5F',
        cream: '#F5F0E8',
        success: '#16A34A',
        destructive: '#DC2626',
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        badge: '6px',
      },
      boxShadow: {
        card: '0px 2px 12px rgba(30, 58, 95, 0.08)',
        'card-hover': '0px 4px 20px rgba(30, 58, 95, 0.14)',
      },
    },
  },
  plugins: [],
}
