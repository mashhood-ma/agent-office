import { Caffeine } from './caffeine';
import type { CafeDrink } from '../../../shared/cafe';
import type { Ctx } from '../../core/context';
import { hintTitle, key, onE } from '../../core/hint';
import { toast } from '../../ui/dom';
import { openCafeMenu } from './ui';
import { CAFE_COUNTER_POS } from '../../world/office/cafe';

// The kinds of thing you can use that this defines (see InteractKinds in world/types.ts).
declare module '../../world/types' {
  interface InteractKinds {
    coffee: true;
    cafe: true;
  }
}

export interface CoffeeDeps {
  reach?(): void;
}

/**
 * Coffee systems: the kitchen's espresso machine and the Lobby Café counter downstairs.
 * What the caffeine does to you each frame is feelTheCoffee's, in core/loop.ts.
 */
export function installCoffee(ctx: Ctx, deps?: CoffeeDeps) {
  const caffeine = new Caffeine();
  /** What it does to you (see player/effects.ts): feelTheCoffee writes it each frame, the view's shake (ctx.shake) in its jitters too. */
  const buzz = ctx.player.effects.add();

  /** A cup from the kitchen machine: a minute of quicker feet and higher jumps, and a mug in your hand. */
  function drinkKitchenCoffee() {
    const jittery = caffeine.drink(performance.now() / 1000);
    ctx.sound.coffee();
    deps?.reach?.();
    if (ctx.player.view === 'first') ctx.hands.sip();
    if (jittery) toast('☕ One cup too many… you’ve got the jitters!', 'warn');
    else if (caffeine.cups > 1) toast('☕ Another cup: back to a full minute of buzz');
    else toast('☕ Fresh coffee! A minute of quicker feet and higher jumps');
  }

  /** E at the kitchen machine. */
  ctx.interactions.define('coffee', {
    reach: 3,
    hint: (it) => {
      const buzzed = caffeine.buzzed(performance.now() / 1000);
      return { k: String(buzzed), parts: [hintTitle(it.label ?? '☕ Coffee machine'), key('E', buzzed ? 'Another cup' : 'Grab a cup')] };
    },
    use: onE(() => drinkKitchenCoffee()),
  });

  /** Orders a drink from the Lobby Café menu. */
  function orderCafeDrink(d: CafeDrink) {
    const now = performance.now() / 1000;
    const res = caffeine.drinkCustom(d, now);
    ctx.sound.coffee(CAFE_COUNTER_POS);
    deps?.reach?.();
    if (ctx.player.view === 'first') ctx.hands.sip();
    if (res.soothed) {
      toast('🫖 Decaf: Ahh, the jitters are gone! Calm and warm.');
    } else if (res.jittery) {
      toast(`☕ ${d.name}: Whoa… that’s a heavy dose! You’ve got the jitters!`, 'warn');
    } else if (caffeine.cups > 1) {
      toast(`☕ ${d.name}: Extra buzz! (${Math.round(caffeine.left(now))}s left)`);
    } else {
      toast(`☕ ${d.name}: +${Math.round((d.speed - 1) * 100)}% speed, +${Math.round((d.jump - 1) * 100)}% jump for ${d.duration}s`);
    }
  }

  function showCafeMenu() {
    openCafeMenu({
      jittery: caffeine.jitter(performance.now() / 1000) > 0,
      order: orderCafeDrink,
    });
  }

  /** E at the Lobby Café counter downstairs. */
  ctx.interactions.define('cafe', {
    reach: 3.2,
    hint: () => {
      const buzzed = caffeine.buzzed(performance.now() / 1000);
      return { k: String(buzzed), parts: [hintTitle('☕ Lobby Café'), key('E', 'Coffee menu')] };
    },
    use: onE(() => showCafeMenu()),
  });

  return { caffeine, buzz, showCafeMenu };
}
