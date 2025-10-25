/* eslint-disable no-underscore-dangle */
// @ts-check

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { configs, plugins, rules } from 'eslint-config-airbnb-extended';
import { rules as prettierConfigRules } from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import typescriptEslint from 'typescript-eslint';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const gitignorePath = resolve(__dirname, '.gitignore');

/** @type {import('@eslint/compat').FlatConfig[]} */
const jsConfig = [
  // ESLint Recommended Rules
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  // Stylistic Plugin
  plugins.stylistic,
  // Import X Plugin
  plugins.importX,
  // Airbnb Base Recommended Config
  ...configs.base.recommended,
  // Strict Import Config
  rules.base.importsStrict,
];

/** @type {import('@eslint/compat').FlatConfig[]} */
const nodeConfig = [
  // Node Plugin
  plugins.node,
  // Airbnb Node Recommended Config
  ...configs.node.recommended,
];

const typescriptConfig = typescriptEslint.config(
  js.configs.recommended,
  typescriptEslint.configs.recommended,
  configs.base.typescript,
  {
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  }
);

/** @type {import('@eslint/compat').FlatConfig[]} */
const prettierConfig = [
  // Prettier Plugin
  {
    name: 'prettier/plugin/config',
    plugins: {
      prettier: prettierPlugin,
    },
  },
  // Prettier Config
  {
    name: 'prettier/config',
    rules: {
      ...prettierConfigRules,
      'prettier/prettier': 'error',
    },
  },
];

const eslintConfig = [
  {
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
  },
  // Ignore .gitignore files/folder in eslint
  includeIgnoreFile(gitignorePath),
  {
    ignores: ['out/', 'build/', 'dist/', 'src/database/migrations/'],
  },
  // Javascript Config
  ...jsConfig,
  // Node Config
  ...nodeConfig,
  // TypeScript Config
  ...typescriptConfig,
  // Prettier Config
  ...prettierConfig,
  {
    rules: {
      'no-plusplus': 'off',
      'no-console': 'error',
      'no-param-reassign': 'off',
      radix: 'off',
      'no-nested-ternary': 'off',
      'class-methods-use-this': 'off',
      'import/extensions': 'off',
      'max-classes-per-file': 'off',
      'max-len': [
        'error',
        {
          code: 120,
        },
      ],
    },
  },
  {
    rules: {
      'import-x/extensions': 'off',
      'import-x/no-unresolved': 'off',
    },
  },
  {
    files: ['**/*.entity.ts'],
    rules: {
      'import-x/no-cycle': 'off',
    },
  },
];

export default eslintConfig;
