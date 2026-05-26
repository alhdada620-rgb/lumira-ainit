#!/usr/bin/env node
/**
 * Post-build SSR smoke check.
 *
 * Runs after `vite build`. Catches ERR_MODULE_NOT_FOUND and similar
 * import-time failures BEFORE the user clicks Publish.
 *
 * Two checks:
 *   1. Scan recent dev-server daemon logs (when available in the sandbox)
 *      for ERR_MODULE_NOT_FOUND / "Cannot find module".
 *   2. Dynamically import the built SSR bundle (dist/server/server.js) so
 *      any missing-module error surfaces here instead of in production.
 *
 * Exits non-zero on failure so the build (and therefore publish) aborts.
 */

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const log = {
  ok:   (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`),
  warn: (m) => console.warn(`\x1b[33m⚠\x1b[0m ${m}`),
  err:  (m) => console.error(`\x1b[31m✗\x1b[0m ${m}`),
  info: (m) => console.log(`\x1b[36mℹ\x1b[0m ${m}`),
};

let failed = false;
const PATTERNS = /ERR_MODULE_NOT_FOUND|Cannot find module|Failed to resolve import|missing module/i;

// 1. Scan dev-server daemon logs if sqlite + db are available.
try {
  const db = "/tmp/sandbox-state.db";
  if (existsSync(db)) {
    const out = execSync(
      `sqlite3 ${db} "SELECT content FROM daemon_logs WHERE daemon_name='vite' ORDER BY id DESC LIMIT 300;"`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const hits = out.split("\n").filter((l) => PATTERNS.test(l));
    if (hits.length) {
      log.err(`Found ${hits.length} module-resolution error(s) in dev-server logs:`);
      hits.slice(0, 5).forEach((h) => console.error(`    ${h.trim()}`));
      failed = true;
    } else {
      log.ok("No ERR_MODULE_NOT_FOUND in recent dev-server logs.");
    }
  } else {
    log.info("Sandbox daemon log DB not present — skipping log scan.");
  }
} catch (e) {
  log.warn(`Could not scan dev-server logs: ${e.message}`);
}

// 2. Smoke-import the built SSR bundle.
const serverBundle = resolve(ROOT, "dist/server/server.js");
if (existsSync(serverBundle)) {
  try {
    await import(pathToFileURL(serverBundle).href);
    log.ok("SSR bundle imports cleanly (no missing modules).");
  } catch (e) {
    const msg = String(e?.message ?? e);
    if (PATTERNS.test(msg) || e?.code === "ERR_MODULE_NOT_FOUND") {
      log.err(`SSR bundle import failed: ${msg}`);
      failed = true;
    } else {
      // Non-resolution errors (e.g. env reads at top-level) are acceptable
      // here — Workers runtime will handle them. We only gate on missing modules.
      log.warn(`SSR bundle import threw (non-resolution): ${msg.split("\n")[0]}`);
    }
  }
} else {
  log.warn(`No SSR bundle at ${serverBundle} — skipping import smoke test.`);
}

if (failed) {
  log.err("Pre-publish check FAILED. Fix module resolution before publishing.");
  process.exit(1);
}
log.ok("Pre-publish SSR check passed.");
