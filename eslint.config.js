import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // `app/` is the separate Expo/React Native mobile app, `blueprint-contributors/`
  // is its own separate Vite project (own package.json, own build/dev
  // scripts), and `contracts/_build/` is a standalone Node/CommonJS script
  // suite for generating the contract PDFs (own package.json, intentional
  // require() usage) — none of these three are this web project's own
  // source and were never meant to be swept up by this config, same
  // reasoning as the app/ exclusion below.
  { ignores: ["dist", "app", "blueprint-contributors", "contracts/_build"] },
  {
    // This web project is almost entirely .jsx/.js (101 .jsx + 24 .js files
    // vs just 2 .ts files as of Oct 2026) — `files: ["**/*.{ts,tsx}"]` alone
    // meant `npm run lint` only ever checked those 2 files and silently
    // skipped the rest of src/ with zero warning, so a clean lint run looked
    // reassuring but wasn't actually checking the codebase. Widened to also
    // cover .js/.jsx so the real source gets linted.
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
