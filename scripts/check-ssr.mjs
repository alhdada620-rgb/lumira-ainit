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

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname, relative, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execSync } from "node:child_process";
import { findSourceMap, SourceMap } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const log = {
  ok:   (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`),
  warn: (m) => console.warn(`\x1b[33m⚠\x1b[0m ${m}`),
  err:  (m) => console.error(`\x1b[31m✗\x1b[0m ${m}`),
  info: (m) => console.log(`\x1b[36mℹ\x1b[0m ${m}`),
};

let failed = false;

const RESOLUTION_PATTERNS = /ERR_MODULE_NOT_FOUND|Cannot find module|Failed to resolve import|missing module/i;
const JS_ERROR_PATTERNS = /ReferenceError|SyntaxError|TypeError|Cannot read properties|Cannot access before initialization|is not defined|Unexpected token|Unexpected identifier/i;
const ALL_PATTERNS = new RegExp(
  `(?:${RESOLUTION_PATTERNS.source.slice(1, -1)}|${JS_ERROR_PATTERNS.source.slice(1, -1)})`,
  "i"
);

// Collectors for the interactive summary
const resolutionErrors = [];
const jsErrors = [];

// ── Sourcemap resolution helpers ────────────────────────────────────────
// Cache loaded SourceMap instances by absolute generated-file path.
const smCache = new Map();

function loadSourceMapFor(absPath) {
  if (smCache.has(absPath)) return smCache.get(absPath);
  let sm = null;
  try {
    // First try Node's runtime cache (works for already-imported modules).
    sm = findSourceMap(absPath) ?? null;
    if (!sm) {
      // Fall back to reading the sibling .map file from disk.
      const mapPath = absPath + ".map";
      if (existsSync(mapPath)) {
        const payload = JSON.parse(readFileSync(mapPath, "utf8"));
        sm = new SourceMap(payload);
      }
    }
  } catch {
    sm = null;
  }
  smCache.set(absPath, sm);
  return sm;
}

function mapFrame(absPath, line, column) {
  const sm = loadSourceMapFor(absPath);
  if (!sm) return null;
  try {
    // Node's SourceMap API is 0-indexed for both line and column.
    const entry = sm.findEntry(Math.max(0, line - 1), Math.max(0, column - 1));
    if (!entry || !entry.originalSource) return null;
    let src = entry.originalSource;
    if (src.startsWith("file://")) src = fileURLToPath(src);
    if (isAbsolute(src)) {
      const rel = relative(ROOT, src);
      if (!rel.startsWith("..")) src = rel;
    }
    return {
      source: src,
      line: (entry.originalLine ?? 0) + 1,
      column: (entry.originalColumn ?? 0) + 1,
    };
  } catch {
    return null;
  }
}

// Resolve any "<path>:<line>:<col>" reference inside a string to original source.
// Returns an array of "→ src/foo.ts:12:3" annotation strings (deduped).
function resolveReferences(text) {
  const out = new Set();
  // Match absolute paths, file:// URLs, or dist-relative paths.
  const re = /(?:file:\/\/)?((?:\/|[A-Za-z]:\\)[^\s:()'"]+|dist\/[^\s:()'"]+):(\d+):(\d+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    let p = m[1];
    if (!isAbsolute(p)) p = resolve(ROOT, p);
    if (!existsSync(p)) continue;
    const mapped = mapFrame(p, Number(m[2]), Number(m[3]));
    if (mapped) out.add(`→ ${mapped.source}:${mapped.line}:${mapped.column}`);
  }
  return [...out];
}

function addResolution(source, message) {
  const refs = resolveReferences(message);
  resolutionErrors.push({ source, message: message.trim().slice(0, 300), refs });
  failed = true;
}
function addJsError(source, message) {
  const refs = resolveReferences(message);
  jsErrors.push({ source, message: message.trim().slice(0, 300), refs });
  failed = true;
}

function printSummary() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    SSR Smoke Check Summary                   ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");

  const resCount = resolutionErrors.length;
  const jsCount  = jsErrors.length;

  if (!resCount && !jsCount && !failed) {
    console.log("║  ✓ 0 errors found                                            ║");
  } else {
    console.log(`║  Module-resolution errors : ${String(resCount).padStart(3)}                          ║`);
    console.log(`║  JS runtime/syntax errors : ${String(jsCount).padStart(3)}                          ║`);
  }
  console.log("╠══════════════════════════════════════════════════════════════╣");

  const renderGroup = (title, list) => {
    console.log(`║  ${title.padEnd(60)}║`);
    list.slice(0, 5).forEach((e, i) => {
      const line = `  ${i + 1}. [${e.source}] ${e.message}`.slice(0, 62);
      console.log(`║${line.padEnd(62)}║`);
      (e.refs ?? []).slice(0, 3).forEach((r) => {
        const refLine = `      ${r}`.slice(0, 62);
        console.log(`║${refLine.padEnd(62)}║`);
      });
    });
    if (list.length > 5) {
      console.log(`║  ... and ${list.length - 5} more`.padEnd(63) + "║");
    }
    console.log("╠══════════════════════════════════════════════════════════════╣");
  };

  if (resCount) renderGroup("Top module-resolution failures:", resolutionErrors);
  if (jsCount)  renderGroup("Top JS runtime/syntax failures:", jsErrors);

  const status = failed ? "FAILED  — Fix before publishing." : "PASSED";
  const statusColor = failed ? "\x1b[31m" : "\x1b[32m";
  console.log(`${statusColor}║  Status: ${status.padEnd(52)}\x1b[0m║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
}

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
      resolutionHits.slice(0, 5).forEach((h) => {
        console.error(`    ${h.trim()}`);
        addResolution("dev-server log", h);
      });
    } else {
      log.ok("No module-resolution errors in recent dev-server logs.");
    }

    if (jsErrorHits.length) {
      log.err(`Found ${jsErrorHits.length} JS runtime/syntax error(s) in dev-server logs:`);
      jsErrorHits.slice(0, 5).forEach((h) => {
        console.error(`    ${h.trim()}`);
        addJsError("dev-server log", h);
      });
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
    const stack = String(e?.stack ?? msg);
    const isResolution = RESOLUTION_PATTERNS.test(msg) || e?.code === "ERR_MODULE_NOT_FOUND";
    const isJSError    = JS_ERROR_PATTERNS.test(msg);

    if (isResolution || isJSError) {
      log.err(`SSR bundle import failed: ${msg.split("\n")[0]}`);
      // Map any "dist/server/...:line:col" frames in the stack back to source.
      const refs = resolveReferences(stack);
      if (refs.length) {
        log.info("Mapped to source:");
        refs.slice(0, 5).forEach((r) => console.error(`    ${r}`));
      }
      if (isResolution) addResolution("SSR bundle", stack);
      if (isJSError)    addJsError("SSR bundle", stack);
    } else {
      // Non-resolution errors (e.g. env reads at top-level) are acceptable
      // here — Workers runtime will handle them. We only gate on hard errors.
      log.warn(`SSR bundle import threw (non-resolution): ${msg.split("\n")[0]}`);
    }
  }
} else {
  log.warn(`No SSR bundle at ${serverBundle} — skipping import smoke test.`);
}

// 3. Smoke-import every server chunk (server functions, middlewares, route
//    bundles) under dist/server/assets/ in a Worker-like Node environment.
//    Catches module-init crashes in individual handlers that the top-level
//    server.js import may not eagerly evaluate.
const assetsDir = resolve(ROOT, "dist/server/assets");
if (existsSync(assetsDir)) {
  // Worker-like globals. Node 20+ already provides fetch/Request/Response/crypto;
  // warn if any are missing so the smoke check stays representative.
  for (const g of ["fetch", "Request", "Response", "Headers", "crypto"]) {
    if (typeof globalThis[g] === "undefined") {
      log.warn(`globalThis.${g} unavailable — Node ${process.version} may not match Workers runtime.`);
    }
  }

  // Stub env vars that handler modules sometimes read at top-level. Real
  // values come from Workers at request time; we only want to surface JS
  // errors, not missing-config errors.
  const ENV_STUBS = [
    "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY",
    "LOVABLE_API_KEY", "PI_NETWORK_API_KEY", "PI_API_KEY",
  ];
  for (const k of ENV_STUBS) {
    if (!process.env[k]) process.env[k] = `__stub_${k.toLowerCase()}__`;
  }

  const { readdirSync } = await import("node:fs");
  const chunks = readdirSync(assetsDir)
    .filter((f) => f.endsWith(".js"))
    .map((f) => resolve(assetsDir, f));

  let okCount = 0;
  let failCount = 0;
  for (const chunk of chunks) {
    const name = chunk.split("/").pop();
    try {
      await import(pathToFileURL(chunk).href);
      okCount++;
    } catch (e) {
      const msg   = String(e?.message ?? e);
      const stack = String(e?.stack ?? msg);
      const isResolution = RESOLUTION_PATTERNS.test(msg) || e?.code === "ERR_MODULE_NOT_FOUND";
      const isJSError    = JS_ERROR_PATTERNS.test(msg);
      if (isResolution || isJSError) {
        failCount++;
        log.err(`Chunk ${name} failed to import: ${msg.split("\n")[0]}`);
        const refs = resolveReferences(stack);
        refs.slice(0, 3).forEach((r) => console.error(`    ${r}`));
        if (isResolution) addResolution(`chunk:${name}`, stack);
        if (isJSError)    addJsError(`chunk:${name}`, stack);
      }
      // Other errors (e.g. config validation) are tolerated here.
    }
  }
  if (failCount === 0) {
    log.ok(`All ${okCount} server chunk(s) imported cleanly in Worker-like env.`);
  } else {
    log.err(`${failCount} of ${chunks.length} server chunk(s) failed to import.`);
  }
} else {
  log.info(`No assets dir at ${assetsDir} — skipping per-chunk smoke test.`);
}

printSummary();

if (failed) {
  process.exit(1);
}
log.ok("Pre-publish SSR check passed.");
