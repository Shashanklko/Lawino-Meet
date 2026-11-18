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
          dark: 'var(--admin-bg-base)',
          panel: 'var(--admin-bg-panel)',
          sidebar: 'var(--admin-bg-sidebar)',
          header: 'var(--admin-bg-header)',
          card: 'var(--admin-bg-card)',
          border: 'var(--admin-border)',
          'border-subtle': 'var(--admin-border-subtle)',
          accent: 'var(--admin-accent)',
          'accent-hover': 'var(--admin-accent-hover)',
          gold: 'var(--admin-accent-gold)',
          primary: 'var(--admin-text-primary)',
          secondary: 'var(--admin-text-secondary)',
          muted: 'var(--admin-text-muted)',
        },
      },
    },
  },
  plugins: [],
};
