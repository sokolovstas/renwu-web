const nxPreset = require('@nx/jest/preset').default;
const { join } = require('path');

const workspaceRoot = __dirname;

module.exports = {
  ...nxPreset,
  testPathIgnorePatterns: [
    ...(nxPreset.testPathIgnorePatterns || []),
    '/e2e/',
  ],
  moduleNameMapper: {
    ...(nxPreset.moduleNameMapper || {}),
    '^jest-zone-transloco-setup$': join(
      workspaceRoot,
      'jest-zone-transloco-setup.ts',
    ),
    '^mermaid$': join(workspaceRoot, 'jest.stubs/mermaid.ts'),
    '^oz$': join(workspaceRoot, 'jest.stubs/oz.ts'),
    '^projects/components/src/public-api$': join(
      workspaceRoot,
      'libs/components/src/index.ts',
    ),
  },
  /** Transpile ESM used by Transloco (@jsverse) and Angular packages in node_modules. */
  transformIgnorePatterns: [
    'node_modules/(?!((@angular|@jsverse)/|.*\\.mjs$))',
  ],
};
