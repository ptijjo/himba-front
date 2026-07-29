/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        himba: {
          night: '#0B0618',
          surface: '#161022',
          earth: '#1E1730',
          ember: '#FF6600',
          saffron: '#F0B429',
          ochre: '#8B6B4A',
          copper: '#C4845A',
          pulse: '#FF7A1A',
          alert: '#E83A4A',
          ink: '#F5F0FF',
          mist: '#A39BB8',
          canopy: '#2A1F3D',
          glass: 'rgba(22, 16, 34, 0.72)',
        },
      },
      fontFamily: {
        serif: ['Literata_700Bold'],
        sans: ['System'],
      },
      borderRadius: {
        pill: '9999px',
        card: '24px',
      },
    },
  },
  plugins: [],
};
