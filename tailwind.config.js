/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
        fontFamily: {
            sans: ['Inter', 'sans-serif'],
        },
        colors: {
            primary: {
                50: '#f0f9ff',
                100: '#e0f2fe',
                200: '#bae6fd',
                300: '#7dd3fc',
                400: '#38bdf8',
                500: '#0ea5e9',
                600: '#0284c7',
                700: '#0369a1',
                800: '#075985',
                900: '#0c4a6e',
            },
        },
        animation: {
            'fade-in': 'fadeIn 0.5s ease-out',
            'slide-up': 'slideUp 0.5s ease-out',
            'float': 'float 3s ease-in-out infinite',
            'pulse-slow': 'pulseSlow 6s ease-in-out infinite',
            'bounce-subtle': 'bounceSlight 2s ease-in-out infinite',
            'spin-slow': 'spin 8s linear infinite',
            'rotate-slow': 'spin 20s linear infinite',
            'wave': 'wave 10s linear infinite',
            'shimmer': 'shimmer 2s linear infinite',
            'scale-in': 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            'float-up': 'floatUp var(--duration, 15s) ease-in infinite',
        },
        keyframes: {
            fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
            },
            floatUp: {
                '0%': { transform: 'translateY(100vh) scale(0)', opacity: '0' },
                '50%': { opacity: 'var(--opacity, 0.5)' },
                '100%': { transform: 'translateY(-100px) scale(1)', opacity: '0' },
            },
            slideUp: {
                '0%': { transform: 'translateY(20px)', opacity: '0' },
                '100%': { transform: 'translateY(0)', opacity: '1' },
            },
            float: {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-10px)' },
            },
            pulseSlow: {
                '0%, 100%': { opacity: '0.4' },
                '50%': { opacity: '0.8' },
            },
            bounceSlight: {
                '0%, 100%': { transform: 'translateY(0)' },
                '50%': { transform: 'translateY(-5px)' },
            },
            wave: {
                '0%': { transform: 'translateX(0) translateY(0)' },
                '50%': { transform: 'translateX(-25%) translateY(10px)' },
                '100%': { transform: 'translateX(0) translateY(0)' },
            },
            shimmer: {
                '0%': { backgroundPosition: '-1000px 0' },
                '100%': { backgroundPosition: '1000px 0' },
            },
            scaleIn: {
                '0%': { transform: 'scale(0.8)', opacity: '0' },
                '100%': { transform: 'scale(1)', opacity: '1' },
            },
        },
    },
  },
  plugins: [],
}
