/**
 * Shared definitions for the Lobby Café drinks and caffeine profiles.
 */

export type CafeDrinkId =
  | 'espresso'
  | 'americano'
  | 'latte'
  | 'cappuccino'
  | 'mocha'
  | 'coldbrew'
  | 'decaf';

export interface CafeDrink {
  id: CafeDrinkId;
  name: string;
  emoji: string;
  /** What the cafe menu says about it. */
  blurb: string;
  /** Relative caffeine potency. 0 for decaf, 1.0 for standard drip, up to 1.6 for cold brew. */
  caffeine: number;
  /** How long the buzz lasts in seconds. */
  duration: number;
  /** Walking and running speed multiplier while buzzed (1.0 = normal). */
  speed: number;
  /** Jump height/speed multiplier while buzzed (1.0 = normal). */
  jump: number;
  /** Color of the liquid in cup. */
  color: string;
}

export const CAFE_DRINKS: readonly CafeDrink[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    emoji: '☕',
    blurb: 'Double shot: intense, fast rush',
    caffeine: 1.2,
    duration: 45,
    speed: 1.45,
    jump: 1.25,
    color: '#3d2314',
  },
  {
    id: 'americano',
    name: 'Americano',
    emoji: '☕',
    blurb: 'Espresso over hot water: clean and crisp',
    caffeine: 1.0,
    duration: 60,
    speed: 1.4,
    jump: 1.2,
    color: '#4a2c1d',
  },
  {
    id: 'latte',
    name: 'Latte',
    emoji: '🥛',
    blurb: 'Smooth steamed milk over espresso',
    caffeine: 0.7,
    duration: 60,
    speed: 1.3,
    jump: 1.15,
    color: '#c49a6c',
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    emoji: '☕',
    blurb: 'Rich espresso with thick velvety foam',
    caffeine: 0.8,
    duration: 60,
    speed: 1.35,
    jump: 1.18,
    color: '#9c6f44',
  },
  {
    id: 'mocha',
    name: 'Mocha',
    emoji: '🍫',
    blurb: 'Rich chocolate, espresso and steamed milk',
    caffeine: 0.85,
    duration: 65,
    speed: 1.35,
    jump: 1.22,
    color: '#5c3826',
  },
  {
    id: 'coldbrew',
    name: 'Cold Brew',
    emoji: '🧊',
    blurb: 'Steeped for 18 hours: maximum caffeine kick',
    caffeine: 1.5,
    duration: 85,
    speed: 1.5,
    jump: 1.28,
    color: '#26140b',
  },
  {
    id: 'decaf',
    name: 'Decaf',
    emoji: '🫖',
    blurb: 'All the coffee taste, zero caffeine; soothes jitters',
    caffeine: 0,
    duration: 30,
    speed: 1.0,
    jump: 1.0,
    color: '#54331e',
  },
];

export const CAFE_DRINK_BY_ID = new Map(CAFE_DRINKS.map((d) => [d.id, d]));

/** Default standard kitchen coffee machine drink profile (exact original behavior). */
export const KITCHEN_DRIP: CafeDrink = {
  id: 'americano',
  name: 'Coffee',
  emoji: '☕',
  blurb: 'Fresh drip coffee from the kitchen machine',
  caffeine: 1.0,
  duration: 60,
  speed: 1.4,
  jump: 1.2,
  color: '#4a2c1d',
};
