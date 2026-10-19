import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", ".superpowers/**", "node_modules/**", "playwright-report/**", "test-results/**", "next-env.d.ts"] },
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["app/diaries/_components/DiaryForm.tsx", "app/diaries/_hooks/useDiaryForm.ts"],
    // React Compiler is not enabled. RHF's non-memoizable watch API is intentional;
    // keep the existing form contract rather than adopting Compiler in a dependency fix.
    rules: { "react-hooks/incompatible-library": "off" },
  },
];
export default config;
