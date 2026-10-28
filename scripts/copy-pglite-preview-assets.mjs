/**
 * When Nitro inlines the server bundle, PGLite looks for its wasm/data files
 * next to the function entry. Copy them for local `vite preview` (no DATABASE_URL).
 * Deployed Neon never opens these files.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "node_modules/@electric-sql/pglite/dist");
const dest = join(root, ".vercel/output/functions/__server.func");
if (!existsSync(dest)) process.exit(0);
mkdirSync(dest, { recursive: true });
for (const name of ["pglite.data", "pglite.wasm", "initdb.wasm", "initdb.js"]) {
  const from = join(dist, name);
  if (existsSync(from)) copyFileSync(from, join(dest, name));
}
