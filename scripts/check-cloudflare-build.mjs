import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

await access('dist/index.html');
assert.match(await readFile('dist/.assetsignore', 'utf8'), /^server$/m);
assert.equal(
  JSON.parse(await readFile('dist/server/wrangler.json', 'utf8')).assets.directory,
  '..'
);
