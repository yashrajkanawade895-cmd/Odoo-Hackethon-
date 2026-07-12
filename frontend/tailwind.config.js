/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C2128',
        surface: '#F6F5F2',
        panel: '#FFFFFF',
        line: '#DCD9D2',
        accent: '#2B6E5E',
        status: {
          available: '#2B6E5E',
          allocated: '#3D5A8A',
          reserved: '#8A6D3D',
          maintenance: '#B8863B',
          lost: '#A13D3D',
          retired: '#8B8680',
          disposed: '#6B6560',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
