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
        // Maroon & Cream Palette (Flagship)
        maroon: {
          950: '#1F0408',
          900: '#33080E',
          800: '#4A0E17',
          700: '#64131F',
          600: '#831826',
          500: '#A41E30',
          400: '#C23A4D',
          100: '#FDECEF',
          50: '#FFF5F6',
        },
        cream: {
          50: '#FFFEFA',
          100: '#FBF8F0',
          200: '#F5EFEB',
          300: '#EBE1D5',
          400: '#DCCBBA',
          500: '#C9B19C',
          900: '#3D342B',
        },
        // Luxury Gold Accents
        luxury: {
          gold: '#C5A880',
          'gold-light': '#DFCAA9',
          'gold-dark': '#9A7D54',
          bronze: '#A3704C',
          pearl: '#F8F6F0',
        },
        // Navy & Gold Palette
        navy: {
          950: '#070F1E',
          900: '#0B192C',
          800: '#142942',
          700: '#1E3E62',
        },
        // Emerald & Pearl Palette
        emeraldLegal: {
          950: '#051812',
          900: '#0A261D',
          800: '#123D2F',
          700: '#1A5340',
        },
        // Onyx & Obsidian Palette
        onyx: {
          950: '#0A0A0A',
          900: '#141414',
          800: '#222222',
          700: '#333333',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'wave-slow': 'wave 18s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite',
        'wave-medium': 'wave 12s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite -3s',
        'wave-fast': 'wave 8s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite -5s',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 2s infinite',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%': { transform: 'translateX(0) translateZ(0) scaleY(1)' },
          '50%': { transform: 'translateX(-25%) translateZ(0) scaleY(0.85)' },
          '100%': { transform: 'translateX(-50%) translateZ(0) scaleY(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: 0.9, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.03)' },
        },
      },
    },
  },
  plugins: [],
}
