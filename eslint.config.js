import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/**
 * ESLint 9 flat config.
 * Run: npm run lint / npm run lint:fix
 */
export default [
  {
    ignores: ['dist/**', 'dev-dist/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React
      'react/jsx-key': 'error',
      'react/no-unknown-property': 'warn',
      'react/no-deprecated': 'warn',
      // Mark variables used in JSX as used (otherwise no-unused-vars
      // flags every component used as <Component />)
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Fast Refresh (Vite HMR)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // General
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    // Context files export a provider component + its hook — a valid pattern
    // that Fast Refresh's only-export-components rule would keep flagging.
    files: ['src/context/**/*.{js,jsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Vitest globals for test files
    files: ['**/*.test.{js,jsx}', '**/setupTests.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
  },
  {
    // Node environment for config/build scripts
    files: ['vite.config.js', 'eslint.config.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
]
