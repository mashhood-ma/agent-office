import test from 'node:test';
import assert from 'node:assert/strict';
import { CAFE_DRINKS, CAFE_DRINK_BY_ID, type CafeDrinkId } from '../src/shared/cafe.js';
import { Caffeine } from '../src/client/features/coffee/caffeine.js';

test('CAFE_DRINKS contains all 7 specified drinks with valid configurations', () => {
  const expectedIds: CafeDrinkId[] = ['espresso', 'americano', 'latte', 'cappuccino', 'mocha', 'coldbrew', 'decaf'];
  assert.equal(CAFE_DRINKS.length, 7);
  for (const id of expectedIds) {
    const d = CAFE_DRINK_BY_ID.get(id);
    assert.ok(d, `Drink ${id} exists in CAFE_DRINK_BY_ID`);
    assert.ok(d.name.length > 0);
    assert.ok(d.emoji.length > 0);
    assert.ok(typeof d.caffeine === 'number' && d.caffeine >= 0);
    assert.ok(d.duration > 0);
    assert.ok(d.speed >= 1.0);
    assert.ok(d.jump >= 1.0);
  }
});

test('existing kitchen coffee drink(now) preserves exact original behavior', () => {
  const c = new Caffeine();
  const t0 = 1000;

  // Cup 1
  const j1 = c.drink(t0);
  assert.equal(j1, false, 'cup 1 has no jitters');
  assert.equal(c.cups, 1);
  assert.equal(c.buzzed(t0), true);
  assert.equal(c.left(t0), 60);
  assert.equal(c.speed(t0), 1.4);
  assert.equal(c.jump(t0), 1.2);
  assert.equal(c.jitter(t0), 0);

  // Cup 2 (before cup 1 expires)
  const j2 = c.drink(t0 + 20);
  assert.equal(j2, false, 'cup 2 has no jitters');
  assert.equal(c.cups, 2);
  assert.equal(c.jitter(t0 + 20), 0);

  // Cup 3 (triggers jitters)
  const j3 = c.drink(t0 + 40);
  assert.equal(j3, true, 'cup 3 triggers jitters');
  assert.equal(c.cups, 3);
  assert.ok(c.jitter(t0 + 40) > 0, 'jitter is active');
  assert.equal(c.jitter(t0 + 44), 0, 'jitter ends after 4 seconds');

  // Wears off after duration
  assert.equal(c.buzzed(t0 + 250), false);
  assert.equal(c.speed(t0 + 250), 1.0);
  assert.equal(c.jump(t0 + 250), 1.0);
});

test('high-potency cold brew triggers jitters earlier via accumulation', () => {
  const c = new Caffeine();
  const coldBrew = CAFE_DRINK_BY_ID.get('coldbrew')!;
  const t0 = 1000;

  // 1 cold brew (1.5 caffeine) -> below threshold (2.4)
  const r1 = c.drinkCustom(coldBrew, t0);
  assert.equal(r1.jittery, false);
  assert.equal(c.accumulated, 1.5);

  // 2nd cold brew (1.5 + 1.5 = 3.0 caffeine) -> exceeds 2.4 threshold -> jitters on 2nd cup!
  const r2 = c.drinkCustom(coldBrew, t0 + 10);
  assert.equal(r2.jittery, true);
  assert.equal(c.accumulated, 3.0);
  assert.ok(c.jitter(t0 + 10) > 0);
});

test('custom drinks apply configured speed and jump multipliers', () => {
  const c = new Caffeine();
  const espresso = CAFE_DRINK_BY_ID.get('espresso')!;
  const t0 = 1000;

  c.drinkCustom(espresso, t0);
  assert.equal(c.speed(t0), espresso.speed);
  assert.equal(c.jump(t0), espresso.jump);
  assert.equal(c.left(t0), espresso.duration);
});

test('decaf has zero caffeine and mitigates active jitters', () => {
  const c = new Caffeine();
  const espresso = CAFE_DRINK_BY_ID.get('espresso')!;
  const decaf = CAFE_DRINK_BY_ID.get('decaf')!;
  const t0 = 1000;

  // Accumulate jitters with 2 espressos
  c.drinkCustom(espresso, t0);
  c.drinkCustom(espresso, t0 + 5);
  assert.ok(c.jitter(t0 + 5) > 0, 'active jitters');

  // Drink decaf
  const decafRes = c.drinkCustom(decaf, t0 + 6);
  assert.equal(decafRes.jittery, false);
  assert.equal(decafRes.soothed, true, 'soothed active jitters');
  assert.equal(c.jitter(t0 + 6), 0, 'jitters immediately neutralized');
  assert.ok(c.accumulated < 2.4, 'caffeine accumulation reduced');
});

test('cafe seating stools exist in SEATING at street level with roof: false', async () => {
  const { SEATING_BY_ID, STREET_Y, seatHere } = await import('../src/shared/layout.js');
  for (let i = 1; i <= 4; i++) {
    const id = `cafe-stool-${i}`;
    const stool = SEATING_BY_ID.get(id);
    assert.ok(stool, `${id} is defined`);
    assert.equal(stool.y, STREET_Y, 'stool is at ground level');
    assert.equal(stool.roof, false, 'stool is not on roof');
    const place = seatHere(`${id}:0`, false);
    assert.ok(place, `${id} place is reachable when not on roof`);
    assert.equal(seatHere(`${id}:0`, true), undefined, 'not reachable on roof');
  }
});

