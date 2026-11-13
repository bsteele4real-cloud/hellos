import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const srcPath = join(dir, "preview.ts");
const src = readFileSync(srcPath, "utf8");

test("preview.ts does not hard-code a client secret and loads from env names", () => {
  assert.equal(
    /PREVIEW_CLIENT_SECRET[\s\S]{0,120}=\s*["'][A-Za-z0-9_\-+/=]{16,}["']/.test(src),
    false,
  );
  assert.match(src, /GROK_AUTH_CLIENT_SECRET/);
  assert.match(src, /GROK_PREVIEW_CLIENT_SECRET/);
});

function runPreviewImport(env: NodeJS.ProcessEnv): { status: number | null; stdout: string; stderr: string } {
  const runner = `
    const { PREVIEW_CLIENT_SECRET } = await import(${JSON.stringify(srcPath)});
    if (PREVIEW_CLIENT_SECRET === undefined) process.stdout.write("UNSET");
    else process.stdout.write("SET:" + String(PREVIEW_CLIENT_SECRET.length));
  `;
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "-e", runner],
    { env, encoding: "utf8" },
  );
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test("PREVIEW_CLIENT_SECRET is unset when env is empty, and reads a trimmed env value", () => {
  const baseEnv = { ...process.env };
  delete baseEnv.GROK_AUTH_CLIENT_SECRET;
  delete baseEnv.GROK_PREVIEW_CLIENT_SECRET;

  const unset = runPreviewImport({ ...baseEnv, GROK_AUTH_CLIENT_SECRET: "", GROK_PREVIEW_CLIENT_SECRET: "   " });
  assert.equal(unset.status, 0, unset.stderr);
  assert.equal(unset.stdout, "UNSET");

  const fromAuth = runPreviewImport({
    ...baseEnv,
    GROK_AUTH_CLIENT_SECRET: "  unit-test-secret  ",
    GROK_PREVIEW_CLIENT_SECRET: "",
  });
  assert.equal(fromAuth.status, 0, fromAuth.stderr);
  assert.equal(fromAuth.stdout, "SET:16");

  const fromPreview = runPreviewImport({
    ...baseEnv,
    GROK_PREVIEW_CLIENT_SECRET: "preview-only-value",
  });
  assert.equal(fromPreview.status, 0, fromPreview.stderr);
  assert.equal(fromPreview.stdout, "SET:18");
});
