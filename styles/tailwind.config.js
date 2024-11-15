const defTheme = require('tailwindcss/defaultTheme');
const { join } = require('path');

module.exports = {
  theme: {
    colors: {
      sidebar: 'var(--sidebar-bg)',
      'sidebar-text': 'var(--sidebar-text)',
      'sidebar-hover': 'var(--sidebar-bg-hover)',
      'sidebar-text-hover': 'var(--sidebar-text-hover)',
      'sidebar-active': 'var(--sidebar-bg-active)',
      'sidebar-text-active': 'var(--sidebar-text-active)',
      white: 'var(--white)',
      black: 'var(--black)',
      'always-white': 'var(--always-white)',
      'always-black': 'var(--always-black)',

      'gray-100': 'var(--gray-100)',
      'gray-200': 'var(--gray-200)',
      'gray-300': 'var(--gray-300)',
      'gray-400': 'var(--gray-400)',
      'gray-500': 'var(--gray-500)',
      'gray-600': 'var(--gray-600)',
      'gray-700': 'var(--gray-700)',
      'gray-800': 'var(--gray-800)',
      'gray-900': 'var(--gray-900)',

      'dark-100': 'var(--dark-100)',
      'dark-200': 'var(--dark-200)',
      'dark-300': 'var(--dark-300)',
      'dark-400': 'var(--dark-400)',
      'dark-500': 'var(--dark-500)',
      'dark-600': 'var(--dark-600)',
      'dark-700': 'var(--dark-700)',
      'dark-800': 'var(--dark-800)',
      'dark-900': 'var(--dark-900)',

      'accent-50': 'var(--accent-50)',
      'accent-100': 'var(--accent-100)',
      'accent-200': 'var(--accent-200)',
      'accent-300': 'var(--accent-300)',
      'accent-400': 'var(--accent-400)',
      'accent-500': 'var(--accent-500)',
      'accent-600': 'var(--accent-600)',
      'accent-700': 'var(--accent-700)',
      'accent-800': 'var(--accent-800)',
      'accent-900': 'var(--accent-900)',

      accent: 'var(--accent-color)',
      info: 'var(--info-color)',
      success: 'var(--success-color)',
      warn: 'var(--warn-color)',
      error: 'var(--error-color)',
      'accent-primary': 'var(--accent-primary-color)',
      'accent-secondary': 'var(--accent-secondary-color)',
    },
    screens: { ...defTheme.screens, md: '852px' },
  },
  plugins: [],
  content: [
    join(__dirname, '../../../libs/app-ui/**/!(*.stories|*.spec).{ts,html}'),
  ],
};
