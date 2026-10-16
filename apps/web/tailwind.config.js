/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#17171C',
          secondary: '#1C1C23',
        },
        surface: {
          card: '#202027',
          input: '#1B1B22',
        },
        shadow: {
          dark: '#101014',
          light: '#30303A',
        },
        accent: {
          primary: '#B45CFF',
          secondary: '#8B5CF6',
          glow: '#D99BFF',
        },
        text: {
          primary: '#F5F3FA',
          secondary: '#A5A0B5',
          placeholder: '#635E74',
        },
        border: {
          input: '#34313D',
          focus: '#9E65FF',
          subtle: '#2C2C38',
          divider: '#282833',
        },
        status: {
          online: '#86EFAC',
          offline: '#777581',
          error: '#FF6B81',
        },
      },
      boxShadow: {
        'neo-raised': '-4px -4px 10px #30303A, 6px 6px 14px #101014',
        'neo-raised-sm': '-2px -2px 6px #30303A, 4px 4px 10px #101014',
        'neo-recessed': 'inset 2px 2px 5px #101014, inset -2px -2px 5px #30303A',
        'neo-glow': '0 0 24px rgba(180, 92, 255, 0.45)',
        'neo-glow-sm': '0 0 12px rgba(180, 92, 255, 0.35)',
      },
      borderRadius: {
        'squircle': '24px',
      },
    },
  },
  plugins: [],
};
