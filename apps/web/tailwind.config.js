/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'schibsted': ['"Schibsted Grotesk"', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'noto': ['"Noto Sans"', 'sans-serif'],
        'fustat': ['Fustat', 'sans-serif'],
      },
      colors: {
        'gray-text': '#505050',
        'light-gray': '#f8f8f8',
        'dark-badge': '#0e1311',
        'upgrade-green': 'rgba(90,225,76,0.89)',
      },
      letterSpacing: {
        'logo': '-1.44px',
        'menu': '-0.2px',
        'headline': '-4.8px',
        'subtitle': '-0.4px',
      },
    },
  },
  plugins: [],
};
