#!/usr/bin/env node
/**
 * Post-build SSR smoke check.
 *
 * Runs after `vite build`. Catches import-time and runtime JS failures
 * BEFORE the user clicks Publish.
 *
 * Checks:
 *   1. Scan recent dev-server daemon logs (when available in the sandbox)
 *      for module-resolution errors, ReferenceError, SyntaxError,
 *      TypeError / "Cannot read properties of", etc.
 *   2. Dynamically import the built SSR bundle (dist/server/server.js) so
 *      any error surfaces here instead of in production.
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

const RESOLUTION_PATTERNS = /ERR_MODULE_NOT_FOUND|Cannot find module|Failed to resolve import|missing module/i;
const JS_ERROR_PATTERNS = /ReferenceError|SyntaxError|TypeError|Cannot read propert|Cannot read propert|Cannot access before initialization|is not defined|Unexpected token|Unexpected identifier/i;
const ALL_PATTERNS = new RegExp(
  `(?:${RESOLUTION_PATTERNS.source.slice(1, -1)}|${JS_ERROR_PATTERNS.source.slice(1, -1)})`,
  "i"
);

// 1. Scan dev-server daemon logs if sqlite + db are available.
try {
  const db = "/tmp/sandbox-state.db";
  if (existsSync(db)) {
    const out = execSync(
      `sqlite3 ${db} "SELECT content FROM daemon_logs WHERE daemon_name='vite' ORDER BY id DESC LIMIT 300;"`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const lines = out.split("\n");

    const resolutionHits = lines.filter((l) => RESOLUTION_PATTERNS.test(l));
    const jsErrorHits    = lines.filter((l) => JS_ERROR_PATTERNS.test(l));

    if (resolutionHits.length) {
      log.err(`Found ${resolutionHits.length} module-resolution error(s) in dev-server logs:`);
      resolutionHits.slice(0, 5).forEach((h) => console.error(`    ${h.trim()}`));
      failed = true;
    } else {
      log.ok("No module-resolution errors in recent dev-server logs.");
    }

    if (jsErrorHits.length) {
      log.err(`Found ${jsErrorHits.length} JS runtime/syntax error(s) in dev-server logs:`);
      jsErrorHits.slice(0, 5).forEach((h) => console.error(`    ${h.trim()}`));
      failed = true;
    } else {
      log.ok("No ReferenceError / SyntaxError / TypeError in recent dev-server logs.");
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
    log.ok("SSR bundle imports cleanly (no missing modules / no throw).");
  } catch (e) {
    const msg   = String(e?.message ?? e);
    const isResolution = RESOLUTION_PATTERNS.test(msg) || e?.code === "ERR_MODULE_NOT_FOUND";
    const isJSError    = JS_ERROR_PATTERNS.test(msg);

    if (isResolution || isJSError) {
      log.err(`SSR bundle import failed: ${msg.split("\n")[0]}`);
      failed = true;
    } else {
      // Non-resolution errors (e.g. env reads at top-level) are acceptable
      // here — Workers runtime will handle them. We only gate on hard errors.
      log.warn(`SSR bundle import threw (non-resolution): ${msg.split("\n")[0]}`);
    }
  }
} else {
  log.warn(`No SSR bundle at ${serverBundle} — skipping import smoke test.`);
}

if (failed) {
  log.err("Pre-publish check FAILED. Fix errors before publishing.");
  process.exit(1);
}
log.ok("Pre-publish SSR check passed.");
