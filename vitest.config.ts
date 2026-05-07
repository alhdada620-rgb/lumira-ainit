import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "tests/visual/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/components/lumira/**", "src/routes/index.tsx", "src/i18n/**"],
      exclude: ["src/test/**", "**/*.d.ts", "src/routeTree.gen.ts"],
      thresholds: {
        lines: 13,
        branches: 9,
        functions: 12,
        statements: 13,
      },
    },
  },
  esbuild: {
    jsx: "automatic",
  },
});
