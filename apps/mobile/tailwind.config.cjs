const nativewind = require('nativewind/preset')

module.exports = {
  presets: [nativewind],
  content: ['./App.{js,jsx,ts,tsx}', './index.js', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
