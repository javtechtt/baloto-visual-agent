import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The experimental React Compiler rules in eslint-plugin-react-hooks v6 are
    // kept as warnings, not errors. They fire on patterns that are correct and
    // idiomatic in this codebase: media-query/timeout effects that init state,
    // non-deterministic display values (receipt ids, confetti), and the
    // necessarily-imperative three.js animation layer (mutating AnimationActions
    // / objects each frame). Downgrading keeps the signal without failing lint.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
