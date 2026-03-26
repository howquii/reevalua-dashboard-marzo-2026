import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        notion: {
          bg:      '#FFFFFF',
          sidebar: '#F7F7F5',
          hover:   '#EFEFED',
          border:  '#E5E5E3',
          text:    '#37352F',
          muted:   '#787774',
          accent:  '#2383E2',
        },
      },
      fontSize: {
        xs:   ['11px', { lineHeight: '16px' }],
        sm:   ['12px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
        lg:   ['16px', { lineHeight: '24px' }],
        xl:   ['18px', { lineHeight: '28px' }],
        '2xl':['22px', { lineHeight: '32px' }],
      },
    },
  },
  plugins: [],
}

export default config
