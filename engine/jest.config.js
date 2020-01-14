module.exports = {
  // roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  // globals: {
  //   'ts-jest': {
  //     tsConfig: './test/tsconfig.test.json',
  //   },
  // },
  // testRegex: '(/test/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  testRegex: '\\btest/.*\\.spec\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
