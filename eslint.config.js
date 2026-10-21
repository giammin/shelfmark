// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const rxjsX = require('eslint-plugin-rxjs-x').default;
const rxjsAngularX = require('eslint-plugin-rxjs-angular-x').default;

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
      rxjsX.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'rxjs-angular-x': rxjsAngularX,
    },
    processor: angular.processInlineTemplates,
    rules: {
      // Modern Angular APIs: signal-based inputs, outputs, queries and models.
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/prefer-signal-model': 'error',
      '@angular-eslint/no-uncalled-signals': 'error',
      // Subscription leaks: every subscribe must be bound to the owner lifecycle.
      '@angular-eslint/no-implicit-take-until-destroyed': 'error',
      'rxjs-angular-x/prefer-takeuntil': [
        'error',
        {
          checkComplete: true,
          checkDecorators: ['Component', 'Directive', 'Injectable'],
          alias: ['takeUntilDestroyed'],
          checkDestroy: false,
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
    },
  },
]);
