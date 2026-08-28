import assert from 'node:assert/strict';

import { classifyAvailability } from '../src/lib/availability.ts';

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
