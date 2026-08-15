const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');
const tailwind = require('../../styles/tailwind.config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...tailwind.content,
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: { ...tailwind.theme },
  plugins: [],
};
