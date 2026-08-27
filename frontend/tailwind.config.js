/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FEF9F3',
          100: '#FDEBD0',
          500: '#E67E22',
          600: '#CA6F1E',
        },
        success: {
          100: '#D5F5E3',
          500: '#27AE60',
        },
        warning: {
          100: '#FDEBD0',
          500: '#F39C12',
        },
        danger: {
          100: '#FADBD8',
          500: '#E74C3C',
        },
        info: {
          100: '#D6EAF8',
          500: '#2980B9',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          300: '#C5C5C5',
          500: '#7A7A7A',
          700: '#4A4A4A',
          900: '#1A1A1A',
        },
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.12)',
        lg: '0 8px 24px rgba(0,0,0,0.16)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'heading-1': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-2': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-3': ['16px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['11px', { lineHeight: '1.4', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};
