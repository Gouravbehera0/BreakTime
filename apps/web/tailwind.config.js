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
          main: '#17171C',        // Main screen canvas
          secondary: '#1C1C23',   // Container wells, tab rails, modals
        },
        surface: {
          card: '#202027',        // Raised neomorphic cards
          cardHover: '#282833',   // Interactive card & button hover
          input: '#1B1B22',       // Recessed input well
        },
        shadow: {
          dark: '#101014',        // Bottom-right neomorphic shadow
          light: '#30303A',       // Top-left specular rim highlight
        },
        accent: {
          primary: '#B45CFF',     // Radiant neon purple
          secondary: '#8B5CF6',   // Deep violet gradient origin
          glow: 'rgba(180, 92, 255, 0.35)',
        },
        text: {
          primary: '#F5F3FA',     // High-contrast headings and values
          secondary: '#A5A0B5',   // Subtitles, helper text, and inactive states
          muted: '#7E7991',       // Accessible placeholders (>= 4.5:1 on #1B1B22)
          placeholder: '#7E7991', // Input placeholder text
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.05)',
          rim: '#30303A',
          input: '#34313D',
          focus: '#B45CFF',       // Standardized to brand primary purple
          divider: '#282833',
        },
        status: {
          online: '#86EFAC',      // Real-time active & verified badge
          offline: '#777581',     // Inactive status dot
          error: '#FF6B81',       // Validation errors & destructive alerts
        },
      },
      boxShadow: {
        'neo-raised': '-4px -4px 10px #30303A, 6px 6px 14px #101014',
        'neo-raised-sm': '-2px -2px 6px #30303A, 3px 3px 8px #101014',
        'neo-recessed': 'inset 2px 2px 5px #101014, inset -2px -2px 5px #262630',
        'neo-glow': '0 0 20px rgba(180, 92, 255, 0.35)',
        'neo-glow-sm': '0 0 10px rgba(180, 92, 255, 0.25)',
      },
      borderRadius: {
        'control': '12px',        // Buttons, inputs, chips
        'panel': '16px',          // Cards, modals, floating navbar
        'focal': '24px',          // QR frame, activity disc
      },
    },
  },
  plugins: [],
};
