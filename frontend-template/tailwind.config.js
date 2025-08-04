/** @type {import('@tailwindcss/vite').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--color-primary) / 0.05)',
          100: 'rgb(var(--color-primary) / 0.1)',
          200: 'rgb(var(--color-primary) / 0.2)',
          300: 'rgb(var(--color-primary) / 0.3)',
          400: 'rgb(var(--color-primary) / 0.4)',
          500: 'rgb(var(--color-primary) / 1)',
          600: 'rgb(var(--color-primary) / 0.8)',
          700: 'rgb(var(--color-primary) / 0.7)',
          800: 'rgb(var(--color-primary) / 0.6)',
          900: 'rgb(var(--color-primary) / 0.5)',
        },
        secondary: {
          50: 'rgb(var(--color-secondary) / 0.05)',
          100: 'rgb(var(--color-secondary) / 0.1)',
          200: 'rgb(var(--color-secondary) / 0.2)',
          300: 'rgb(var(--color-secondary) / 0.3)',
          400: 'rgb(var(--color-secondary) / 0.4)',
          500: 'rgb(var(--color-secondary) / 1)',
          600: 'rgb(var(--color-secondary) / 0.8)',
          700: 'rgb(var(--color-secondary) / 0.7)',
          800: 'rgb(var(--color-secondary) / 0.6)',
          900: 'rgb(var(--color-secondary) / 0.5)',
        },
        accent: {
          50: 'rgb(var(--color-accent) / 0.05)',
          100: 'rgb(var(--color-accent) / 0.1)',
          200: 'rgb(var(--color-accent) / 0.2)',
          300: 'rgb(var(--color-accent) / 0.3)',
          400: 'rgb(var(--color-accent) / 0.4)',
          500: 'rgb(var(--color-accent) / 1)',
          600: 'rgb(var(--color-accent) / 0.8)',
          700: 'rgb(var(--color-accent) / 0.7)',
          800: 'rgb(var(--color-accent) / 0.6)',
          900: 'rgb(var(--color-accent) / 0.5)',
        }
      },
      fontSize: {
        'base': 'var(--font-size-base, 16px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}

