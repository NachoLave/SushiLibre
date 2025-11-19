import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    ignores: ['node_modules/**', '.next/**'],
  },
  js.configs.recommended,
  nextPlugin.configs['core-web-vitals'],
];

