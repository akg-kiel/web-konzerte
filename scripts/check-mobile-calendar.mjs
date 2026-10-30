import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Guard against viewport breakout inside the intentionally clipped inquiry Card.
const availability = readFileSync('src/components/sections/AvailabilityCalendar.tsx', 'utf8');
const calendar = readFileSync('src/components/ui/calendar.tsx', 'utf8');
const card = readFileSync('src/components/ui/Card.astro', 'utf8');
assert(!/w-dvw|left-1\/2|-translate-x-1\/2/.test(availability));
assert(calendar.includes('w-full table-fixed'));
assert(!calendar.includes('min-w-10'));
assert(card.includes('overflow-hidden'));
// Root padding already clears the navbar; section margins must not add another offset.
assert.match(readFileSync('src/styles/globals.css', 'utf8'), /scroll-padding-top:\s*7rem/);
for (const path of [
  'src/pages/für-veranstalter.astro',
  'src/pages/kontakt.astro',
  'src/components/sections/Concerts.astro'
]) {
  assert.doesNotMatch(readFileSync(path, 'utf8'), /\bscroll-m[ty]-/, path);
}
console.log(
  'Mobile layout: container-bound calendar, shrinkable columns, Card clips retained, no duplicate section scroll offsets.'
);
