import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import sharp from 'sharp';

const { data, info } = await sharp(
  await readFile(new URL('../src/assets/logos/logo-kk.svg', import.meta.url))
)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Sample the original artwork's coordinates, accounting for the cropped viewBox.
const pixel = (x, y) => {
  const offset = ((y - 320) * info.width + x - 240) * info.channels;
  return [...data.subarray(offset, offset + 4)];
};

for (const [x, y] of [
  [978, 1159],
  [976, 930],
  [250, 330]
]) {
  assert.equal(pixel(x, y)[3], 0, `Logo counter/background at ${x},${y} must be transparent`);
}
for (const [x, y] of [
  [300, 1000],
  [978, 1005],
  [976, 840]
]) {
  assert.deepEqual(pixel(x, y), [255, 255, 255, 255], `Logo stroke at ${x},${y} must be white`);
}

const header = await readFile(
  new URL('../src/components/layout/Header.astro', import.meta.url),
  'utf8'
);
assert.doesNotMatch(header.match(/<img\b[\s\S]*?\/>/)[0], /\bbg-white\b/);

console.log('Header logo checks passed (white strokes, transparent counters and background).');
