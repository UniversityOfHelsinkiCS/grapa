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
]



// import js from "@eslint/js";
// import globals from "globals";
// import tseslint from "typescript-eslint";
// import { defineConfig } from "eslint/config";

// export default defineConfig([
//   { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: {...globals.browser, ...globals.node} } },
//   tseslint.configs.recommended,
// ]);
