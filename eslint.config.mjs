import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import nextTs from 'eslint-config-next/typescript';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

import js from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals,
  ...nextTs,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{js,jsx}', '**/*.{ts,tsx}'],
    rules: {
      'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
    },
  },
  {
    files: ['**/*.{ts,tsx}', '**/*.ts/*.js', '**/*.mjs'],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: { perfectionist, prettier },
    rules: {
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      'perfectionist/sort-named-imports': [
        1,
        {
          order: 'asc',
          type: 'line-length',
        },
      ],
      'perfectionist/sort-named-exports': [
        1,
        {
          order: 'asc',
          type: 'line-length',
        },
      ],
      'perfectionist/sort-exports': [
        1,
        {
          order: 'asc',
          type: 'line-length',
        },
      ],
      'perfectionist/sort-imports': [
        1,
        {
          order: 'asc',
          type: 'line-length',
          newlinesBetween: 'always',
          groups: [['builtin', 'external'], ['internal', 'parent', 'sibling', 'index', 'object'], 'unknown'],
          internalPattern: ['@/*'],
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'dist',
    'node_modules',
    '.github',
    'types.generated.d.ts',
    '.next',
  ]),
]);

export default eslintConfig;
