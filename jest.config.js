/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ["<rootDir>/**/*.spec.ts"],
  // See https://github.com/kulshekhar/ts-jest/issues/4081#issuecomment-1515758013
  transform: {
    '.ts': ['ts-jest', { tsconfig: './tsconfig.jest.json' }],
  },
};
