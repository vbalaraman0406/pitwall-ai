/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'pitwall': {
          'bg': '#0a0a0f',
          'card': '#12121a',
          'border': '#1e1e2e',
          'accent': '#e10600',
          'accent-hover': '#ff1801',
          'text': '#e4e4e7',
          'text-muted': '#71717a',
          'green': '#00d2be',
          'yellow': '#fcd34d',
          'blue': '#3b82f6',
        },
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
