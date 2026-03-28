import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");

/**
 * React Compiler / eslint-plugin-react-hooks strict rules flag many valid patterns
 * (mounted gates, pagination reset, Radix ref merging). Turn off the noisiest ones so
 * `npm run lint` and CI stay green; fix real bugs (e.g. conditional hooks) in code.
 */
const relaxedReactCompilerRules = {
  "react/no-unescaped-entities": "off",
  "react-hooks/set-state-in-effect": "off",
  "react-hooks/refs": "off",
  "react-hooks/preserve-manual-memoization": "off",
  "react-hooks/purity": "off",
};

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/tests/**",
      "**/generated/**",
      "**/prisma/generated/**",
      ".eslintcache",
    ],
  },
  ...nextCoreWebVitals,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: relaxedReactCompilerRules,
  },
];

export default eslintConfig;
