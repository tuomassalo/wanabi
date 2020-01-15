module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:@typescript-eslint/recommended'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    /////
    'no-console': 0, // console.log ok
    'no-empty': 0, // catch(e) {}
    // 'no-unused-vars': ['warn', {argsIgnorePattern: '_$'}],
    'no-extra-semi': 0, // starting a line ok
    'no-octal': 0, // for file modes
    // 'require-atomic-updates': 0, // see https://github.com/eslint/eslint/issues/11899
    'no-var': 'warn', // prefer const and let
    'no-shadow': 'warn', // local variable names must not "mask" identical names from the containing scope
    'guard-for-in': 'warn', // Did you mean: `for of`?
    'require-await': 'warn', // warn about 'async' functions not having an 'await' inside
    eqeqeq: ['warn', 'smart'], // ===

    /// typescript:
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/member-delimiter-style': [
      1,
      {
        multiline: {
          delimiter: 'none',
          requireLast: false,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
      },
    ],
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/class-name-casing': 0, // interface name `savePageRet` is ok
    '@typescript-eslint/no-empty-interface': 0,
    '@typescript-eslint/no-var-requires': 0, // for now, `const foo = require(...)` is ok
    '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '_$'}],
    '@typescript-eslint/no-inferrable-types': 0, // `_initialized: boolean = false` is ok
    '@typescript-eslint/camelcase': 0, // `firstImage_c` is ok
    '@typescript-eslint/no-empty-function': 0, // `() => {}` is ok
  },
}
