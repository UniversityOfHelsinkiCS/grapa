import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] }, // temp disable jsx,tsx
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        parser: '@babel/eslint-parser',
        project: './tsconfig.json',
      },
    },
    settings: {
    },
  },
  {
    files: ['**/*.integration-test.*', '**/*.test.*'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    files: ['src/client/**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@backend/types',
              message:
                'Please import types from validators (e.g. @backend/validators/...) instead of @backend/types to ensure frontend types exactly match the validated API response.',
            },
          ],
          patterns: [
            {
              group: ['../backend/types', '../../backend/types', '../../../backend/types'],
              message:
                'Please import types from validators (e.g. @backend/validators/...) instead of backend types.',
            },
          ],
        },
      ],
    },
  },
]



// import js from "@eslint/js";
// import globals from "globals";
// import tseslint from "typescript-eslint";
// import { defineConfig } from "eslint/config";

// export default defineConfig([
//   { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
//   tseslint.configs.recommended,
// ]);
