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
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1877f2', // Classic Facebook Blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        social: {
          bg: '#f0f2f5',
          card: '#ffffff',
          hover: '#f2f4f7',
          border: '#e4e6eb',
          text: '#050505',
          muted: '#65676b',
        }
      },
      fontFamily: {
        sans: ['Segoe UI Historic', 'Segoe UI', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        emojiHover: {
          '0%': { transform: 'scale(1) translateY(0)' },
          '50%': { transform: 'scale(1.45) translateY(-8px)' },
          '100%': { transform: 'scale(1.35) translateY(-6px)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        popIn: 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        emojiHover: 'emojiHover 0.2s forwards',
      }
    },
  },
  plugins: [],
}
