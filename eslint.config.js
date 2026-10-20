import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // `app/` is the separate Expo/React Native mobile app (its own
  // package.json, its own JS/JSX files, no relation to this Vite/TS web
  // project) — never meant to be swept up by this config. Before this was
  // added, `npm run lint` from the repo root failed outright: this file's
  // `files: ["**/*.{ts,tsx}"]` scoping means plain .jsx files under app/
  // were silently skipped, but a plain .js file there with an inline
  // `// eslint-disable-next-line react-hooks/exhaustive-deps` comment (e.g.
  // app/src/hooks/useDraftAutosave.js) still got parsed against zero
  // registered rules and errored with "Definition for rule
  // 'react-hooks/exhaustive-deps' was not found" — a false failure with
  // nothing wrong in that file.
  { ignores: ["dist", "app"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
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
