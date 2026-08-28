import assert from 'node:assert/strict';

import { classifyAvailability, parseIsoDate } from '../src/lib/availability.ts';

assert.equal(Number.isFinite(parseIsoDate('2024-02-29')), true);
assert.equal(Number.isNaN(parseIsoDate('2026-02-30')), true);

const statuses = classifyAvailability(
  '2027-01-01',
  '2027-01-08',
  [
    {
      group: 'venue',
      statusId: 2,
      startDate: '2027-01-03T10:00:00Z',
      endDate: '2027-01-03T12:00:00Z'
    },
    {
      group: 'secondary',
      statusId: 2,
      startDate: '2027-01-05T10:00:00Z',
      endDate: '2027-01-05T11:00:00Z'
    }
  ],
  '2027-01-07',
  12
);

assert.equal(statuses['2027-01-01'], 'available');
assert.equal(statuses['2027-01-02'], 'coordination');
assert.equal(statuses['2027-01-03'], 'occupied');
assert.equal(statuses['2027-01-04'], 'coordination');
assert.equal(statuses['2027-01-05'], 'coordination');
assert.equal(statuses['2027-01-06'], 'available');
assert.equal(statuses['2027-01-08'], 'unknown');

const invalidBuffer = classifyAvailability(
  '2027-01-03',
  '2027-01-03',
  [
    {
      group: 'venue',
      statusId: 1,
      startDate: '2027-01-03T10:00:00Z',
      endDate: '2027-01-03T11:00:00Z'
    }
  ],
  '2027-01-03',
  -1
);
assert.equal(invalidBuffer['2027-01-03'], 'coordination');
