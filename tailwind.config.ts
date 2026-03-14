import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        'background-2': '#F8F9FA',
        'background-3': '#F1F3F5',
        'surface-dark': '#0A0A0F',
        'text-primary': '#0A0A0F',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
        accent: '#0A0A0F',
        'accent-blue': '#1D4ED8',
        border: '#E5E7EB',
        'border-strong': '#D1D5DB',
        success: '#16A34A',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        'tight-display': '-0.04em',
        'tight-h1': '-0.03em',
        'tight-h2': '-0.02em',
        'tight-h3': '-0.01em',
        'wide-label': '0.08em',
        'wide-section': '0.1em',
      },
      fontSize: {
        'display': ['4rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.04em' }],
        'h1': ['2.75rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.03em' }],
        'h2': ['1.875rem', { lineHeight: '1.25', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '-0.01em' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'label': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.08em' }],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
      },
      maxWidth: {
        'content': '1120px',
      },
    },
  },
  plugins: [],
};

export default config;
