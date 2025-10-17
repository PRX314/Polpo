/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8f9fa',
          100: '#f1f3f4',
          200: '#e9ecef',
          300: '#dadce0',
          400: '#bdc1c6',
          500: '#9aa0a6',
          600: '#666666',
          700: '#333333',
          800: '#48dbfb',
          900: '#54a0ff',
        },
        accent: {
          cyan: '#48dbfb',
          blue: '#54a0ff',
          purple: '#5f27cd',
        },
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-button': 'linear-gradient(135deg, #48dbfb, #54a0ff)',
        'gradient-accent': 'linear-gradient(90deg, #48dbfb, #54a0ff, #5f27cd)',
      },
      boxShadow: {
        'light': '0 2px 10px rgba(0, 0, 0, 0.1)',
        'medium': '0 8px 25px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}