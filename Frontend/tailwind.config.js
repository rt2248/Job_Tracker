/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#050913',
        surface: '#0d1424',
        'surface-2': '#111827',
        indigo: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
        },
        cyan: '#22d3ee',
        ink: '#f1f5f9',
        muted: {
          DEFAULT: '#64748b',
          light: '#94a3b8',
        },
        green: '#10b981',
        amber: '#f59e0b',
        red: '#ef4444',
        violet: '#a78bfa',
        pink: '#f472b6',
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(1deg)' },
          '66%': { transform: 'translateY(-10px) rotate(-1deg)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'slide-in-up': {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'orb-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(60px, -40px) scale(1.1)' },
        },
        'orb-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-50px, 30px) scale(0.9)' },
        },
        'orb-3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(30px, 50px) scale(1.05)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'orb-1': 'orb-1 18s ease-in-out infinite',
        'orb-2': 'orb-2 22s ease-in-out infinite',
        'orb-3': 'orb-3 16s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'slide-in-up': 'slide-in-up 0.5s ease both',
        'slide-in-right': 'slide-in-right 0.6s ease 0.2s both',
        blink: 'blink 1s step-end infinite',
        float: 'float 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
