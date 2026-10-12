import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["node_modules/", "dist/", "coverage/", "build/"]),

  {
    files: ["**/*.{js,mjs,cjs,ts}"],

    extends: [js.configs.recommended, tseslint.configs.recommended],

    languageOptions: {
      globals: globals.node,
    },

    rules: {
      // Catch debugging logs before deployment.
      "no-console": ["error", { allow: ["warn", "error"] }],

      // Keep unused variables and imports from accumulating.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
