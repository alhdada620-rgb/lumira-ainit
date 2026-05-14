#!/usr/bin/env node
/**
 * Bun + path/dependency compatibility preflight.
 *
 * Runs before `dev` / `build` / `test`. It is intentionally tolerant:
 *   - Never fails the script (always exits 0) so CI matrices on older
 *     Bun versions still proceed.
 *   - Emits clear warnings the agent and the user can act on.
 *
 * Checks performed:
 *   1. Bun runtime version (>= 1.1.0 recommended, >= 1.2.0 ideal).
 *   2. Node fallback availability when running outside Bun.
 *   3. Required project paths exist; auto-creates safe defaults.
 *   4. Critical dependencies are installed (warns + suggests `bun install`).
 *   5. .env presence (writes a stub if absent so Vite does not crash).
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const log = {
  ok:   (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`),
  warn: (m) => console.warn(`\x1b[33m⚠\x1b[0m ${m}`),
  info: (m) => console.log(`\x1b[36mℹ\x1b[0m ${m}`),
};

function parseSemver(v) {
  const m = String(v ?? "").match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}
function gte(a, b) {
  if (!a) return false;
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch >= b.patch;
}

// 1. Runtime check
const bunVersion = typeof Bun !== "undefined" ? Bun.version : process.versions?.bun ?? null;
const nodeVersion = process.versions?.node ?? null;

if (bunVersion) {
  const v = parseSemver(bunVersion);
  if (gte(v, { major: 1, minor: 2, patch: 0 })) {
    log.ok(`Bun ${bunVersion} (recommended)`);
  } else if (gte(v, { major: 1, minor: 1, patch: 0 })) {
    log.ok(`Bun ${bunVersion} (supported)`);
  } else {
    log.warn(`Bun ${bunVersion} is older than 1.1.0 — please upgrade: \`curl -fsSL https://bun.sh/install | bash\``);
  }
} else if (nodeVersion) {
  const n = parseSemver(nodeVersion);
  if (gte(n, { major: 18, minor: 0, patch: 0 })) {
    log.ok(`Node ${nodeVersion} fallback active (Bun not detected)`);
  } else {
    log.warn(`Node ${nodeVersion} is below 18 — install Bun or upgrade Node.`);
  }
} else {
  log.warn("Could not detect runtime — proceeding anyway.");
}

// 2. Required directories — auto-create safe fallbacks so imports never break.
const REQUIRED_DIRS = ["src/assets", "src/components/ui", "public"];
for (const d of REQUIRED_DIRS) {
  const p = resolve(ROOT, d);
  if (!existsSync(p)) {
    mkdirSync(p, { recursive: true });
    log.info(`Created missing directory: ${d}`);
  }
}

// 3. .env stub so Vite doesn't choke when secrets are not yet wired.
const envPath = resolve(ROOT, ".env");
if (!existsSync(envPath)) {
  writeFileSync(
    envPath,
    "# Auto-generated stub — Lovable Cloud will overwrite this with real values.\n",
  );
  log.info("Wrote .env stub.");
}

// 4. Critical dependencies — warn (don't fail) if missing.
try {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const CRITICAL = [
    "react", "react-dom", "vite", "vitest",
    "@tanstack/react-router", "@tanstack/react-start",
    "@supabase/supabase-js", "tailwindcss",
  ];
  const missing = CRITICAL.filter((name) => {
    if (!deps[name]) return true;
    return !existsSync(resolve(ROOT, "node_modules", name, "package.json"));
  });
  if (missing.length) {
    log.warn(`Missing/uninstalled dependencies: ${missing.join(", ")}`);
    log.info("Run `bun install` (or `npm install`) to restore them.");
  } else {
    log.ok("All critical dependencies present.");
  }
} catch (e) {
  log.warn(`Could not inspect package.json: ${e.message}`);
}

// Always succeed — preflight is advisory, never blocking.
process.exit(0);
