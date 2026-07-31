/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Netflix-inspired palette (kept under the `marquee` key so existing
        // component classes like `bg-marquee-gold` don't need to change).
        marquee: {
          bg: '#141414',        // Netflix black background
          surface: '#181818',   // card / panel surface
          surface2: '#232323',  // elevated surface (hover, modals)
          border: '#3A3A3A',
          gold: '#E50914',      // Netflix red — primary accent
          goldMuted: '#B20710', // darker red hover state
          crimson: '#E50914',   // same red for favorites/alerts
          text: '#FFFFFF',      // white
          muted: '#B3B3B3',     // Netflix secondary gray
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'marquee-gradient': 'linear-gradient(180deg, rgba(20,20,20,0) 0%, rgba(20,20,20,0.9) 70%, #141414 100%)',
        'spotlight': 'radial-gradient(circle at 50% 0%, rgba(229,9,20,0.15) 0%, rgba(20,20,20,0) 60%)',
      },
      boxShadow: {
        glow: '0 8px 30px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
