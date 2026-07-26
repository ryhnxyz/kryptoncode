import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const coreDir = path.join(here, '..', 'src', 'core');
const source = fs.readdirSync(coreDir)
  .filter((name) => /\.(js|jsx)$/.test(name))
  .map((name) => fs.readFileSync(path.join(coreDir, name), 'utf8'))
  .join('\n');

test('public frontend source contains no real infrastructure identifiers or operational alerts', () => {
  for (const forbidden of [
    'xaut-swap-bot',
    'vmi3429943',
    'api_kryptoncode',
    'vps-web-terminal',
    'router-proxy',
    'pm2 reload',
    'memory crept',
    'slow leak',
    '/v1/exec',
  ]) {
    assert.equal(source.includes(forbidden), false, `found forbidden public string: ${forbidden}`);
  }
});

test('public copy explicitly gates operational details behind authentication', () => {
  assert.match(source, /admin yang terautentikasi/);
  assert.match(source, /authenticated administrators/);
  assert.doesNotMatch(source, /Log langsung|Live logs|Deploy backend/);
});
