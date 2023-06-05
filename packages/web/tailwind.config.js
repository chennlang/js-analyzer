module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      borderColor: {
        'active': 'var(--an-c-active)',
        'gray': 'var(--an-c-gray)',
      },
      backgroundColor: {
        'active': 'var(--an-active-bg)',
        'gray': 'var(--an-c-gray)',
      }
    },
    textColor: {
      'active': 'var(--an-c-active)',
      'normal': 'var(--an-c-normal)',
      'white': 'var(--an-c-white)',
      'gray': 'var(--an-c-gray)',
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
