/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // HSL Semantic Tokens
        canvas: {
          DEFAULT: 'hsl(var(--canvas))',
          subtle: 'hsl(var(--canvas-subtle))',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface-primary))',
          primary: 'hsl(var(--surface-primary))',
          secondary: 'hsl(var(--surface-secondary))',
          elevated: 'hsl(var(--surface-elevated))',
          overlay: 'hsl(var(--surface-overlay))',
          2: 'hsl(var(--surface-secondary))',
        },
        ink: {
          DEFAULT: 'hsl(var(--text-primary))',
          primary: 'hsl(var(--text-primary))',
          secondary: 'hsl(var(--text-secondary))',
          muted: 'hsl(var(--text-muted))',
          disabled: 'hsl(var(--text-disabled))',
        },
        border: {
          DEFAULT: 'hsl(var(--border-primary))',
          primary: 'hsl(var(--border-primary))',
          subtle: 'hsl(var(--border-subtle))',
          accent: 'hsl(var(--border-accent))',
        },
        indigo: {
          DEFAULT: 'hsl(var(--brand-indigo))',
          light: 'hsl(var(--brand-indigo-light))',
        },
        cyan: {
          DEFAULT: 'hsl(var(--brand-cyan))',
        },
        status: {
          wishlist: 'hsl(var(--status-wishlist))',
          applied: 'hsl(var(--status-applied))',
          interview: 'hsl(var(--status-interview))',
          offer: 'hsl(var(--status-offer))',
          rejected: 'hsl(var(--status-rejected))',
        },
        muted: {
          DEFAULT: 'hsl(var(--text-muted))',
          light: 'hsl(var(--text-secondary))',
        },
        green: '#10b981',
        amber: '#f59e0b',
        red: '#ef4444',
        violet: '#a78bfa',
        pink: '#f472b6',
      },
      fontFamily: {
        sans: ['Geist Variable', 'Inter', 'sans-serif'],
        body: ['Geist Variable', 'Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        elevated: '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
        glow: '0 0 20px -5px rgba(99, 102, 241, 0.25)',
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
