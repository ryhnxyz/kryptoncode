// Decode base64-encoded binary assets into public/ before build.
// Binary files can't ride through the GitHub API as raw bytes, so they live
// in assets-src/ as .b64 text and get materialized here (build & dev).
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, 'assets-src');
const outDir = join(root, 'public');

if (!existsSync(srcDir)) {
  console.log('[decode-assets] assets-src/ not found, skipping');
  process.exit(0);
}

mkdirSync(outDir, { recursive: true });

const entries = readdirSync(srcDir).filter((f) => f.endsWith('.b64'));
for (const entry of entries) {
  const outName = basename(entry, '.b64');
  const outPath = join(outDir, outName);
  const b64 = readFileSync(join(srcDir, entry), 'utf8').replace(/\s+/g, '');
  writeFileSync(outPath, Buffer.from(b64, 'base64'));
  console.log(`[decode-assets] ${entry} -> public/${outName}`);
}
