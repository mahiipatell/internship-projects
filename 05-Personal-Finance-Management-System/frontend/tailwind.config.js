/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm, premium finance-app palette (CRED / Fi Money / Jupiter style).
        // Named "primary" so every existing component (Button, Card, focus
        // rings, StatCard tones, etc.) picks up the new look automatically.
        primary: {
          50: '#fefbea',
          100: '#fdf5c9',
          200: '#fbe98d',
          300: '#f9db56',
          400: '#f5c944',
          500: '#eab308', // butter yellow — main brand color
          600: '#ca9a04',
          700: '#a37c08',
        },
        sage: {
          50: '#f3f7f1',
          100: '#e2ecdc',
          400: '#93b98a',
          500: '#749768', // soft sage green — accent
          600: '#5c7a53',
        },
        mint: '#c9e9d8',
        cream: '#fdfaf1',
        olive: {
          600: '#4b4a33',
          700: '#3a3926',
          900: '#242316', // primary text color, warm charcoal/olive
        },
        income: '#5b9a6f', // soft green
        expense: '#e08e79', // soft coral
        warning: '#eab308',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Manrope"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 10px 0 rgb(36 35 22 / 0.05), 0 1px 2px 0 rgb(36 35 22 / 0.03)',
        card: '0 4px 20px -2px rgb(36 35 22 / 0.08)',
        lift: '0 12px 28px -6px rgb(36 35 22 / 0.15)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
