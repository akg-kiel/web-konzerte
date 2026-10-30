import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { Script } from 'node:vm';

const root = new URL('../.taste-skill/', import.meta.url);
for (const path of [
  'after/check-layout.mjs',
  'before/smoke-check.mjs',
  'before/confirm-check.mjs',
  'lib/cdp.mjs'
]) {
  const file = new URL(path, root);
  const source = await readFile(file, 'utf8');
  for (const [, specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    if (specifier.startsWith('node:')) continue;
    assert(specifier.startsWith('.'), `${path} must use repository-relative imports`);
    await access(new URL(specifier, file));
  }
  assert.doesNotMatch(
    source,
    /\/home\/|\.pi\/agent\/skills\//,
    `${path} must not require private agent files`
  );
}
const { Browser } = await import(new URL('lib/cdp.mjs', root));
assert.equal(typeof Browser.launch, 'function');
const reference = await readFile(new URL('lib/broken-ui-detectors.md', root), 'utf8');
const blocks = [...reference.matchAll(/```js\n([\s\S]*?)```/g)].map((match) => match[1]);
assert.equal(blocks.length, 8, 'The shared helper and seven detector snapshots must be included');
for (const block of blocks.slice(1))
  new Script(`(() => { ${blocks[0]} return (${block.replace(/;\s*$/, '')})(); })()`);
console.log('Review browser checks use repository-managed imports and detector resources.');
