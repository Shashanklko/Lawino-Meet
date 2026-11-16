/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        admin: {
          dark: '#161210',
          panel: '#1A1614',
          sidebar: '#1C1816',
          header: '#241E1C',
          border: '#2E2724',
          accent: '#941B2B',
          gold: '#E9A943',
        },
      },
    },
  },
  plugins: [],
};
