import { KITCHEN_DRIP, type CafeDrink } from '../../../shared/cafe';

/**
 * Coffee and caffeine engine: handles caffeine accumulation, duration, speed/jump
 * boosts, high-dose jitters, and decaf jitter mitigation.
 * Times are seconds on whichever clock the caller passes in as `now`.
 */

/** Default buzz duration for standard drip coffee (seconds). */
export const BUZZ_SECONDS = 60;
/** Default walking and running speed multiplier while buzzed. */
const DEFAULT_SPEED = 1.4;
/** Default jump speed multiplier while buzzed. */
const DEFAULT_JUMP = 1.2;
/** The boost eases off over the last few seconds instead of stopping dead. */
const FADE_SECONDS = 4;
/** The cup in a row that brings on the jitters. */
const JITTERY_CUP = 3;
/** Accumulated caffeine threshold that triggers jitters. */
const JITTER_CAFFEINE_THRESHOLD = 2.4;
/** Duration of the jitters episode in seconds. */
const JITTER_SECONDS = 4;

export interface DrinkResult {
  /** Whether this drink brought on or renewed the jitters. */
  jittery: boolean;
  /** Whether this drink soothed an active jitter state (Decaf). */
  soothed: boolean;
}

export class Caffeine {
  /** When the current buzz wears off (seconds). */
  private until = 0;
  /** When active jitters wear off (seconds). */
  private jitterUntil = 0;
  /** Accumulated caffeine units currently active in player's system. */
  accumulated = 0;
  /** Active target speed multiplier. */
  private targetSpeed = DEFAULT_SPEED;
  /** Active target jump multiplier. */
  private targetJump = DEFAULT_JUMP;
  /** Cups in a row, each drunk before the one before it wore off. */
  cups = 0;

  /**
   * Drinks a custom café beverage with its own caffeine potency, duration, and boosts.
   */
  drinkCustom(drink: CafeDrink, now: number): DrinkResult {
    // Decaf: zero caffeine, mitigates jitters according to configured rules
    if (drink.caffeine <= 0) {
      const wasJittery = this.jitter(now) > 0;
      this.jitterUntil = 0;
      this.accumulated = Math.max(0, this.accumulated - 1.0);
      this.cups = Math.max(0, this.cups - 1);
      return { jittery: false, soothed: wasJittery };
    }

    const active = this.buzzed(now);
    if (active) {
      this.cups += 1;
      this.accumulated += drink.caffeine;
      // Stack duration up to a reasonable cap (e.g. 3 minutes max)
      this.until = Math.min(now + 180, Math.max(this.until, now) + drink.duration);
      this.targetSpeed = Math.max(this.targetSpeed, drink.speed);
      this.targetJump = Math.max(this.targetJump, drink.jump);
    } else {
      this.cups = 1;
      this.accumulated = drink.caffeine;
      this.until = now + drink.duration;
      this.targetSpeed = drink.speed;
      this.targetJump = drink.jump;
    }

    const jittery = this.cups >= JITTERY_CUP || this.accumulated >= JITTER_CAFFEINE_THRESHOLD;
    if (jittery) this.jitterUntil = now + JITTER_SECONDS;
    return { jittery, soothed: false };
  }

  /**
   * Standard kitchen machine drink: tops buzz back up to a full minute.
   * Preserves exact original method signature and behavior.
   */
  drink(now: number): boolean {
    return this.drinkCustom(KITCHEN_DRIP, now).jittery;
  }

  buzzed(now: number): boolean {
    return now < this.until;
  }

  /** Seconds of buzz left. */
  left(now: number): number {
    return Math.max(0, this.until - now);
  }

  /** Walking and running speed, as a multiple of normal. */
  speed(now: number): number {
    const s = this.strength(now);
    return 1 + (this.targetSpeed - 1) * s;
  }

  /** Jump speed, as a multiple of normal. */
  jump(now: number): number {
    const s = this.strength(now);
    return 1 + (this.targetJump - 1) * s;
  }

  /** 0 (steady) to 1 (the jitters), settling down over the last second. */
  jitter(now: number): number {
    return Math.min(1, Math.max(0, this.jitterUntil - now));
  }

  private strength(now: number): number {
    return Math.min(1, this.left(now) / FADE_SECONDS);
  }
}
