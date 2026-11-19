import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

import { venue, venueAddress } from '../src/data/venue.ts';

const facts = [
  venue.address.street,
  ...Object.values(venue.accessibility),
  venue.concertPhone.label
];
for (const path of (await readdir('src', { recursive: true })).filter((path) =>
  path.endsWith('.astro')
)) {
  const source = await readFile(`src/${path}`, 'utf8');
  for (const fact of facts) {
    assert(!source.includes(fact), `${path}: use the shared venue data instead of copying ${fact}`);
  }
  assert.doesNotMatch(source, /flache Rampe|WC[^<\n]*Gemeindehaus/);
}

const visit = await readFile('src/pages/besuch-planen.astro', 'utf8');
for (const field of Object.keys(venue.accessibility)) {
  assert(visit.includes(`{venue.accessibility.${field}}`), `Visit page: missing ${field}`);
}
for (const path of ['src/pages/kontakt.astro', 'src/components/sections/ProgrammePage.astro']) {
  const source = await readFile(path, 'utf8');
  assert(source.includes('{venue.accessibility.entrance}'), `${path}: keep the access summary`);
  assert.match(source, /href="\/besuch-planen\/#barrierefreiheit"/);
  assert.doesNotMatch(source, /venue\.accessibility\.(?:toilet|wheelchairPlaces)/);
}

if (process.argv.includes('--built')) {
  const visitHtml = await readFile('dist/besuch-planen/index.html', 'utf8');
  const contactHtml = await readFile('dist/kontakt/index.html', 'utf8');
  for (const text of Object.values(venue.accessibility)) assert(visitHtml.includes(text));
  assert(contactHtml.includes(venue.accessibility.entrance));
  assert(!contactHtml.includes(venue.accessibility.toilet));
  assert(!contactHtml.includes(venue.accessibility.wheelchairPlaces));
  assert(contactHtml.includes('href="/besuch-planen/#anfahrt"'));
  assert(contactHtml.includes('href="/besuch-planen/#barrierefreiheit"'));
  assert(contactHtml.includes(`href="${venue.concertPhone.href}"`));
  for (const id of ['anfahrt', 'parken', 'barrierefreiheit']) {
    assert(visitHtml.includes(`id="${id}"`), `Visit page: missing link target ${id}`);
  }
  for (const path of ['', 'besuch-planen/', 'kontakt/', 'impressum/', 'für-veranstalter/']) {
    const html = await readFile(`dist/${path}index.html`, 'utf8');
    assert(html.includes(venueAddress), `${path || '/'}: missing shared venue address`);
  }
}
console.log('Visitor information: shared facts, contextual summaries and detail links passed.');
