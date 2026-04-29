import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
import jestConfig from '@map-colonies/eslint-config/jest';
import jestPlugin from 'eslint-plugin-jest';
import { defineConfig } from 'eslint/config';

export default defineConfig(jestConfig, tsBaseConfig, {
  files: ['**/*.spec.ts', '**/*.test.ts'],
  plugins: { jest: jestPlugin },
  rules: {
    '@typescript-eslint/unbound-method': 'off',
    'jest/unbound-method': 'error',
  },
});
