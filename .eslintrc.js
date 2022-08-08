module.exports = {
  root: true,
  env: {
    node: true,
  },
  parserOptions: {
    parser: '@babel/eslint-parser',
    sourceType: 'module',
  },
  extends: ['airbnb-base', 'plugin:sonarjs/recommended', 'prettier'],
  plugins: ['sonarjs'],
  // add your custom rules here
  rules: {},
};
