import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'gestionale-x', 'backend/node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // ignoreRestSiblings: scartare campi con { id, ...resto } e' il modo
      // normale di ripulire un oggetto prima di risalvarlo, non una svista.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', ignoreRestSiblings: true }],
    },
  },
  {
    // Il server Express gira su Node, non nel browser
    files: ['backend/**/*.js'],
    languageOptions: { globals: globals.node },
    rules: { 'no-unused-vars': ['error', { caughtErrors: 'none', varsIgnorePattern: '^[A-Z_]' }] },
  },
])
