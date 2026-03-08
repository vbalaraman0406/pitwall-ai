/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'f1-red': '#E10600',
        'f1-dark': '#15151E',
        'f1-card': '#1E1E2E',
        'f1-card-hover': '#2A2A3E',
        'f1-accent': '#FFFFFF',
        'f1-gray': '#6B7280',
        'f1-muted': '#9CA3AF',
        'tire-soft': '#FF3333',
        'tire-medium': '#FFD700',
        'tire-hard': '#FFFFFF',
        'tire-inter': '#39B54A',
        'tire-wet': '#0067FF',
      },
      fontFamily: {
        'f1': ['Formula1', 'Arial', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
