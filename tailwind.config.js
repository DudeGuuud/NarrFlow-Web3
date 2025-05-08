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
        primary: {
          50: '#f0f7ff',
          100: '#e0f0fe',
          200: '#bae3fd',
          300: '#7dcffc',
          400: '#38b6f8',
          500: '#0e9de9',
          600: '#0279c7',
          700: '#0362a1',
          800: '#074f85',
          900: '#0c426e',
        },
        secondary: {
          50: '#fdf6ff',
          100: '#faecff',
          200: '#f5d8fe',
          300: '#f0b8fc',
          400: '#e88cf9',
          500: '#d95eef',
          600: '#c038d3',
          700: '#a228af',
          800: '#86208f',
          900: '#701c75',
        },
        book: {
          cover: '#8B4513',
          spine: '#6B3E26',
          page: '#FFF8E7',
          pageEdge: '#E8DCCA',
          gold: '#D4AF37',
        },
        accent: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
          pink: '#EC4899',
          amber: '#F59E0B',
          emerald: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Merriweather', 'Georgia', 'serif'],
        title: ['Cinzel', 'serif'],
        handwriting: ['Dancing Script', 'cursive'],
        mono: ['Fira Code', 'monospace'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'page-turn': 'pageTurn 1.2s ease-in-out',
        'book-bounce': 'bookBounce 0.5s ease-out',
        'shine': 'shine 2.5s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pageTurn: {
          '0%': { transform: 'rotateY(0deg)', boxShadow: '0 0 0 rgba(0, 0, 0, 0)' },
          '50%': { transform: 'rotateY(-90deg)', boxShadow: '10px 0 30px rgba(0, 0, 0, 0.2)' },
          '100%': { transform: 'rotateY(-180deg)', boxShadow: '0 0 0 rgba(0, 0, 0, 0)' },
        },
        bookBounce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)' },
        },
        shine: {
          '0%': { backgroundPosition: '-100% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
      },
      backgroundImage: {
        'paper-texture': "url('/textures/paper.png')",
        'leather-texture': "url('/textures/leather.png')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'page-curl': "url('/textures/page-curl.png')",
      },
      boxShadow: {
        'book': '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        'book-hover': '0 20px 30px -10px rgba(0, 0, 0, 0.3), 0 15px 15px -10px rgba(0, 0, 0, 0.2)',
        'page': '0 5px 15px rgba(0, 0, 0, 0.1)',
        'card-elegant': '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}