module.exports = {
  env: {
    es2021: true,
    node: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'error',
    camelcase: 'error',
    'max-len': ['warn', { code: 120 }],
    'max-lines': ['warn', { max: 300, skipBlankLines: true }]
  }
};

