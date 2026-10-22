/**
 * Personal basketball stats and records, persisted in localStorage.
 */

export interface BasketballRecords {
  /** Active consecutive made shots. */
  streak: number;
  /** Longest streak ever achieved. */
  bestStreak: number;
  /** Farthest made shot in meters (1 decimal place). */
  longestShot: number;
  /** Lifetime baskets made. */
  totalBaskets: number;
  /** Baskets made from beyond the three-point line (6.75m). */
  threePointers: number;
  /** Clean baskets touching neither rim nor backboard. */
  swishes: number;
  /** Baskets banked off the backboard. */
  banks: number;
}

const STORAGE_KEY = 'agent-office.basketball';

export function defaultRecords(): BasketballRecords {
  return {
    streak: 0,
    bestStreak: 0,
    longestShot: 0,
    totalBaskets: 0,
    threePointers: 0,
    swishes: 0,
    banks: 0,
  };
}

export function loadRecords(storage?: Pick<Storage, 'getItem'>): BasketballRecords {
  const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return defaultRecords();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return defaultRecords();
    const d = JSON.parse(raw) as Partial<BasketballRecords>;
    return {
      streak: typeof d.streak === 'number' && d.streak >= 0 ? d.streak : 0,
      bestStreak: typeof d.bestStreak === 'number' && d.bestStreak >= 0 ? d.bestStreak : 0,
      longestShot: typeof d.longestShot === 'number' && d.longestShot >= 0 ? Math.round(d.longestShot * 10) / 10 : 0,
      totalBaskets: typeof d.totalBaskets === 'number' && d.totalBaskets >= 0 ? d.totalBaskets : 0,
      threePointers: typeof d.threePointers === 'number' && d.threePointers >= 0 ? d.threePointers : 0,
      swishes: typeof d.swishes === 'number' && d.swishes >= 0 ? d.swishes : 0,
      banks: typeof d.banks === 'number' && d.banks >= 0 ? d.banks : 0,
    };
  } catch {
    return defaultRecords();
  }
}

export function saveRecords(records: BasketballRecords, storage?: Pick<Storage, 'setItem'>) {
  const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // private window or quota exceeded
  }
}

export function recordBasket(
  records: BasketballRecords,
  basket: { distance: number; three: boolean; swish: boolean; bank: boolean },
  storage?: Pick<Storage, 'setItem'>,
): BasketballRecords {
  records.streak++;
  if (records.streak > records.bestStreak) records.bestStreak = records.streak;
  records.totalBaskets++;
  const dist = Math.round(basket.distance * 10) / 10;
  if (dist > records.longestShot) records.longestShot = dist;
  if (basket.three) records.threePointers++;
  if (basket.swish) records.swishes++;
  if (basket.bank) records.banks++;
  saveRecords(records, storage);
  return records;
}

export function recordMiss(records: BasketballRecords, storage?: Pick<Storage, 'setItem'>): BasketballRecords {
  if (records.streak > 0) {
    records.streak = 0;
    saveRecords(records, storage);
  }
  return records;
}

export function resetRecords(records: BasketballRecords, storage?: Pick<Storage, 'setItem'>): BasketballRecords {
  Object.assign(records, defaultRecords());
  saveRecords(records, storage);
  return records;
}
