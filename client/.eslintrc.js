module.exports = {
  parser: 'babel-eslint',
  extends: [
    'eslint:recommended'
  ],
  env: {
    browser: true,
    node: true,
    es6: true
  },
  rules: {
    // Allow console logs
    'no-console': 'off',
    // Enforce 2 spaces for indentation
    'indent': ['error', 2, { SwitchCase: 1 }],
    // Disallow trailing whitespace
    'no-trailing-spaces': 'error',
    // Enforce single space after colon in object literals
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    // Enforce spacing after commas
    'comma-spacing': ['error', { before: false, after: true }],
    // Require a space before blocks (the curly brace)
    'space-before-blocks': ['error', 'always'],
    // Allow ignoring unused vars with underscore prefix
    'no-unused-vars': [
      'error',
      {
        'vars': 'all',
        'args': 'after-used',
        'ignoreRestSiblings': false,
        'varsIgnorePattern': '^_',
        'argsIgnorePattern': '^_'
      }
    ]
  }
};

