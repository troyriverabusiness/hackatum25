/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        'blau-primary': '#0F4C81',
        'blau-secondary': '#29ABE2',
      },
      backgroundImage: {
        'gradient-mesh':
          'radial-gradient(circle at 15% 20%, rgba(236, 236, 236, 0.4), rgba(96, 167, 238, 0.55), transparent 50%), radial-gradient(circle at 85% 30%, rgba(236, 236, 236, 0.35), rgba(153, 202, 250, 0.5), transparent 55%), radial-gradient(circle at 50% 80%, rgba(96, 167, 238, 0.35), transparent 60%), radial-gradient(circle at 70% 40%, rgba(153, 202, 250, 0.28), transparent 50%), radial-gradient(circle at 25% 60%, rgba(96, 167, 238, 0.32), transparent 55%)',
      },
      boxShadow: {
        glass: '0 20px 80px rgba(96, 167, 238, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

