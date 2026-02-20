import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
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
      "react-refresh/only-export-components": [
        "warn",
        { 
          allowConstantExport: true, 
          allowExportNames: [
            // Providers
            "AuthProvider", 
            "ThemeProvider",
            // Constants
            "CANDIDATE_STATUS_OPTIONS",
            "STATUS_OPTIONS",
            // Types and Interfaces (these are removed at compile time anyway)
            "ChartConfig",
            "CandidateStatus",
            "PositionStatus",
            "Candidate",
            "PositionDetailsData",
            "RequirementsData",
            "InterviewPrepData",
            "PositionFiltersState",
            "CalendarProps",
            "ButtonProps",
            "BadgeProps",
            "TextareaProps"
          ] 
        }
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
