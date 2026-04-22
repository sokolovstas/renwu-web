/* eslint-disable */
export default {
  displayName: 'task',
  preset: '../../jest.preset.js',
  setupFiles: ['<rootDir>/src/test-setup-mocks.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  globals: {},
  coverageDirectory: '../../../coverage/apps/task',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  /** Allow transpiling ESM from @jsverse (e.g. @jsverse/utils used by Transloco). */
  transformIgnorePatterns: [
    'node_modules/(?!((@angular|@jsverse)/|.*\\.mjs$))',
  ],
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
