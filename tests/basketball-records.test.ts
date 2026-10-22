import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultRecords, loadRecords, recordBasket, recordMiss, resetRecords, type BasketballRecords } from '../src/client/features/basketball/records.js';

function mockStorage(initial?: string) {
  let data = initial ?? null;
  return {
    getItem: () => data,
    setItem: (_k: string, v: string) => {
      data = v;
    },
    raw: () => data,
  };
}

test('loadRecords defaults on empty storage or invalid JSON', () => {
  const empty = mockStorage();
  assert.deepEqual(loadRecords(empty), defaultRecords());

  const invalid = mockStorage('invalid-json{{{');
  assert.deepEqual(loadRecords(invalid), defaultRecords());
});

test('loadRecords reads saved valid records', () => {
  const saved: BasketballRecords = {
    streak: 4,
    bestStreak: 10,
    longestShot: 11.5,
    totalBaskets: 25,
    threePointers: 8,
    swishes: 6,
    banks: 3,
  };
  const store = mockStorage(JSON.stringify(saved));
  assert.deepEqual(loadRecords(store), saved);
});

test('recordBasket tracks streak, best streak, and farthest distance', () => {
  const store = mockStorage();
  const r = loadRecords(store);

  recordBasket(r, { distance: 4.2, three: false, swish: true, bank: false }, store);
  assert.equal(r.streak, 1);
  assert.equal(r.bestStreak, 1);
  assert.equal(r.longestShot, 4.2);
  assert.equal(r.totalBaskets, 1);
  assert.equal(r.swishes, 1);
  assert.equal(r.threePointers, 0);

  recordBasket(r, { distance: 8.56, three: true, swish: false, bank: true }, store);
  assert.equal(r.streak, 2);
  assert.equal(r.bestStreak, 2);
  assert.equal(r.longestShot, 8.6, 'rounds to 1 decimal place');
  assert.equal(r.totalBaskets, 2);
  assert.equal(r.threePointers, 1);
  assert.equal(r.banks, 1);

  // A shorter shot does not lower longestShot
  recordBasket(r, { distance: 3.1, three: false, swish: false, bank: false }, store);
  assert.equal(r.streak, 3);
  assert.equal(r.bestStreak, 3);
  assert.equal(r.longestShot, 8.6);
  assert.equal(r.totalBaskets, 3);

  // Stored properly
  assert.deepEqual(JSON.parse(store.raw()!), r);
});

test('recordMiss resets current streak to 0, keeping best streak and totals intact', () => {
  const store = mockStorage();
  const r = loadRecords(store);

  recordBasket(r, { distance: 5.0, three: false, swish: true, bank: false }, store);
  recordBasket(r, { distance: 5.0, three: false, swish: true, bank: false }, store);
  assert.equal(r.streak, 2);
  assert.equal(r.bestStreak, 2);

  recordMiss(r, store);
  assert.equal(r.streak, 0);
  assert.equal(r.bestStreak, 2);
  assert.equal(r.totalBaskets, 2);

  // Consecutive miss does not error
  recordMiss(r, store);
  assert.equal(r.streak, 0);
});

test('resetRecords wipes all counters to 0', () => {
  const store = mockStorage();
  const r = loadRecords(store);
  recordBasket(r, { distance: 9.0, three: true, swish: true, bank: false }, store);
  assert.equal(r.totalBaskets, 1);

  resetRecords(r, store);
  assert.deepEqual(r, defaultRecords());
  assert.deepEqual(JSON.parse(store.raw()!), defaultRecords());
});
