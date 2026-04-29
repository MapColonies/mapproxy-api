module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  setupFiles: ['<rootDir>/tests/configurations/jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  coverageReporters: ['text', 'html'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!*/node_modules/',
    '!/vendor/**',
    '!*/common/**',
    '!**/models/**',
    '!<rootDir>/src/*',
    '!<rootDir>/src/DAL/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  reporters: [
    'default',
    [
      'jest-html-reporters',
      { multipleReportsUnitePath: './reports', pageTitle: 'integration', publicPath: './reports', filename: 'integration.html' },
    ],
  ],
  rootDir: '../../../.',
  setupFilesAfterEnv: ['jest-openapi', '<rootDir>/tests/configurations/initJestOpenapi.setup.ts'],
  preset: 'ts-jest',
  testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', 'src'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
