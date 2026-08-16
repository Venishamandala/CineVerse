/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support class-based dark mode toggling
  theme: {
    extend: {
      colors: {
        // Dark theme surfaces
        dark: {
          bg: '#0B0F19',       // Deep space dark background
          surface: '#151D30',  // Premium glassmorphic card surfaces
          border: '#222F4D',   // Ultra-thin borders
          text: '#F3F4F6'      // Off-white text
        },
        // Light theme surfaces
        light: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          text: '#0F172A'
        },
        // Accent Color: Cinematic Crimson
        brand: {
          DEFAULT: '#E11D48',  // Rose 600
          hover: '#BE123C',    // Rose 700
          light: '#FDA4AF',    // Rose 300
          glow: 'rgba(225, 29, 72, 0.15)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 30px rgba(0, 0, 0, 0.4)',
        'premium-light': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(225, 29, 72, 0.35)',
      },
      backgroundImage: {
        'cinematic-gradient': 'linear-gradient(to top, #0B0F19 0%, rgba(11, 15, 25, 0.7) 50%, rgba(11, 15, 25, 0) 100%)',
        'light-gradient': 'linear-gradient(to top, #F8FAFC 0%, rgba(248, 250, 252, 0.7) 50%, rgba(248, 250, 252, 0) 100%)'
      }
    },
  },
  plugins: [],
}
