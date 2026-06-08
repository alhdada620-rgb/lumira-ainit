import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const EXPECTED =
  "f51bf3dbe299a0b14c34f9600f4da97c80967509828e08f6cb9358c4e6f2c5dd71917a163a4cb882482fa0afb195abd842775e25c5ed5bcbef3a9bf92bf9c81c";

const targets = [
  "public/validation-key.txt",
  "dist/validation-key.txt",
  "dist/client/validation-key.txt",
];

let failed = false;
for (const t of targets) {
  const p = resolve(t);
  if (!existsSync(p)) {
    console.error(`\x1b[31m✗\x1b[0m Missing: ${t}`);
    failed = true;
    continue;
  }
  const content = readFileSync(p, "utf8").trim();
  if (content !== EXPECTED) {
    console.error(
      `\x1b[31m✗\x1b[0m Content mismatch at ${t} (size=${statSync(p).size})`,
    );
    failed = true;
    continue;
  }
  console.log(`\x1b[32m✓\x1b[0m ${t}`);
}

if (failed) {
  console.error(
    "\nvalidation-key.txt verification FAILED. Build aborted.",
  );
  process.exit(1);
}
console.log("validation-key.txt verified in public, dist, and dist/client.");
