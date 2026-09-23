/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        night: '#0B1026',
        indigo: '#1B2250',
        dusk: '#3A3F7A',
        rose: '#F4A48C',
        amber: '#FFB547',
        sun: '#FFD166',
        cream: '#FFF7E8',
        ink: '#1C1B2E',
        mist: '#6E7191',
        sage: '#3FA37E',
        cloud: '#EEF0F7',
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        'display-bold': ['Fraunces_700Bold'],
        body: ['Nunito_400Regular'],
        'body-semi': ['Nunito_600SemiBold'],
        'body-bold': ['Nunito_700Bold'],
        'body-black': ['Nunito_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
