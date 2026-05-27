import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// Polyfill for missing virtual module in @tanstack/start-server-core 1.169.3.
// start-server-core dynamically imports `tanstack-start-injected-head-scripts:v`
// in dev SSR, but no plugin in start-plugin-core 1.171.5 provides it,
// breaking dev runs with ERR_MODULE_NOT_FOUND. Resolve it to an empty stub.
function injectedHeadScriptsStub(): Plugin {
  const moduleId = "tanstack-start-injected-head-scripts:v";
  const resolvedId = "\0" + moduleId;
  return {
    name: "lovable:injected-head-scripts-stub",
    enforce: "pre",
    resolveId(id) {
      if (id === moduleId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) return "export const injectedHeadScripts = undefined;";
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [injectedHeadScriptsStub()],
    build: {
      // Emit sourcemaps so check-ssr.mjs can map runtime errors back to
      // original source files/lines before publish.
      sourcemap: true,
    },
  },
});
