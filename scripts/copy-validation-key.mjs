import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const validationKey =
  "f51bf3dbe299a0b14c34f9600f4da97c80967509828e08f6cb9358c4e6f2c5dd71917a163a4cb882482fa0afb195abd842775e25c5ed5bcbef3a9bf92bf9c81c";

const targets = [
  "public/validation-key.txt",
  "dist/validation-key.txt",
  "dist/client/validation-key.txt",
];

for (const target of targets) {
  const filePath = resolve(target);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, validationKey, "utf8");
}

console.log(`validation-key.txt written to ${targets.join(", ")}`);