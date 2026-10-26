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
console.log(
  'Mobile calendar: container-bound layout, shrinkable seven-column grid, Card clips retained.'
);
