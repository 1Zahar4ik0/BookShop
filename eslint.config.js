module.exports = [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { document: 'readonly', window: 'readonly', localStorage: 'readonly', fetch: 'readonly', URL: 'readonly', AbortController: 'readonly', process: 'readonly', setInterval: 'readonly', clearInterval: 'readonly' },
    },
    rules: {
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
