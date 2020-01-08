module.exports = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.test.json'
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts']
};
