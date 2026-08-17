import eslint from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

import { defineConfigWithVueTs } from '@vue/eslint-config-typescript';

export default defineConfigWithVueTs([
  {
    // `tmp/` holds maintenance scripts (i18n key check) that run under plain
    // Node, not the app's browser/TS config — linting them as app source only
    // produces no-undef noise for `console` and `process`.
    ignores: ['**/dist/**', '**/node_modules/**', '**/.vite/**', '**/coverage/**', 'scripts/**', 'tmp/**'],
  },

  eslint.configs.recommended,
  tseslint.configs.recommended,
  vue.configs["flat/recommended"],

  {
    files: ["**/*.{js,ts,vue}"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    },
    plugins: {
      vue,
      "@typescript-eslint": ts,
      "unused-imports": unusedImports,
      '@stylistic': stylistic
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],

      "unused-imports/no-unused-imports": "error",

      "@typescript-eslint/no-explicit-any": ["error", {
        "ignoreRestArgs": false,
        "fixToUnknown": false
      }],

      "vue/require-valid-default-prop": "error",
      "vue/no-mutating-props": "error",
      "vue/no-ref-as-operand": "error",
      "vue/require-v-for-key": "error",

      "vue/define-props-declaration": ["error", "type-based"],
      "vue/no-deprecated-dollar-listeners-api": "error",
      "vue/no-deprecated-dollar-scopedslots-api": "error",
      "vue/component-api-style": ["error",
        ["script-setup", "composition"]
      ],
      "vue/no-v-for-template-key-on-child": "error",
      "vue/attribute-hyphenation": ["error", "always", {
        "ignore": [],
        "ignoreTags": []
      }],
      "vue/component-definition-name-casing": ["error", "PascalCase"],
      "vue/first-attribute-linebreak": ["error", {
        "singleline": "ignore",
        "multiline": "below"
      }],
      "vue/html-closing-bracket-newline": [
        "error",
        {
          "singleline": "never",
          "multiline": "always",
          "selfClosingTag": {
            "singleline": "never",
            "multiline": "always"
          }
        }
      ],
      "vue/html-indent": ["error", 2, {
        "attribute": 1,
        "baseIndent": 2,
        "closeBracket": 0,
        "alignAttributesVertically": true,
        "ignores": []
      }],
      "vue/html-self-closing": ["error", {
        "html": {
          "void": "never",
          "normal": "always",
          "component": "always"
        },
        "svg": "always",
        "math": "always"
      }],
      "vue/max-attributes-per-line": ["error", {
        "singleline": {
          "max": 2
        },
        "multiline": {
          "max": 1
        }
      }],
      "vue/multiline-html-element-content-newline": ["error"],
      "vue/no-spaces-around-equal-signs-in-attribute": ["error"],
      "vue/prop-name-casing": ["error",
        "camelCase"
      ],
      "vue/no-deprecated-model-definition": "error",
      "@stylistic/semi": ["error", "always"],
      "@stylistic/function-call-argument-newline": ["error", "consistent"],
      "@stylistic/function-paren-newline": ["error", "multiline-arguments"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/object-curly-spacing": ["error", "always"],

      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_"
        }
      ],

      "vue/no-unused-vars": "warn"
    }
  },
]);
