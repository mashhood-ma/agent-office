import { CAFE_DRINKS, type CafeDrink } from '../../../shared/cafe';
import { h, openModal, type Modal } from '../../ui/dom';
import './ui.css';

export interface CafeMenuOptions {
  /** Whether the player currently has the jitters. */
  jittery?: boolean;
  order(d: CafeDrink): void;
}

/** Opens the Lobby Café menu modal. */
export function openCafeMenu(opts: CafeMenuOptions): Modal {
  const close = h('button.btn.close', { 'aria-label': 'Close' }, '✕');

  const list = h(
    'ul.svc-list',
    {},
    ...CAFE_DRINKS.map((d) => {
      const effectTags: HTMLElement[] = [];
      if (d.caffeine <= 0) {
        effectTags.push(
          h('span.effect-tag.soothe', {}, 'Zero caffeine'),
          h('span.effect-tag.soothe', {}, 'Soothes jitters'),
        );
      } else {
        const speedPct = Math.round((d.speed - 1) * 100);
        const jumpPct = Math.round((d.jump - 1) * 100);
        const potency = d.caffeine >= 1.4 ? '⚡⚡⚡ Strong' : d.caffeine >= 1.0 ? '⚡⚡ Medium' : '⚡ Light';
        effectTags.push(
          h('span.effect-tag.caffeine', {}, potency),
          h('span.effect-tag.boost', {}, `+${speedPct}% speed`),
          h('span.effect-tag.boost', {}, `+${jumpPct}% jump`),
          h('span.effect-tag', {}, `${d.duration}s buzz`),
        );
      }

      const orderBtn = h('button.btn.order-btn', { type: 'button' }, 'Order');

      const li = h(
        'li',
        {
          tabindex: 0,
          role: 'button',
          'aria-label': `Order ${d.name}`,
          title: `Order ${d.name}`,
        },
        h('span.jb-icon', { style: 'font-size:26px' }, d.emoji),
        h(
          'div.svc-main',
          {},
          h('div.svc-title', {}, d.name),
          h('div.svc-meta', {}, d.blurb),
          h('div.cafe-effects', {}, ...effectTags),
        ),
        orderBtn,
      );

      const pick = () => {
        modal.close();
        opts.order(d);
      };

      li.addEventListener('click', pick);
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
      return li;
    }),
  );

  const jitterWarning = opts.jittery
    ? h(
        'p.setting-note',
        { style: 'margin:0 0 12px;font-weight:800;color:#d84315' },
        '⚠️ You have the jitters from too much caffeine! Order a Decaf to soothe your trembling.',
      )
    : null;

  const el = h(
    'div.modal.cafe-menu',
    { role: 'dialog', 'aria-label': 'Lobby Café' },
    h('header', {}, h('h2', {}, '☕ Lobby Café'), close),
    h(
      'div.body',
      {},
      jitterWarning,
      h('p.setting-note', { style: 'margin:0 0 10px' }, 'Freshly brewed in the lobby. Multiple cups increase buzz and may cause jitters.'),
      list,
    ),
    h('footer', {}, h('span.grow', {}, 'Enjoy hot or iced at the lobby counter.')),
  );

  const modal = openModal(el);
  close.addEventListener('click', () => modal.close());
  setTimeout(() => (list.querySelector('li[tabindex="0"]') as HTMLElement | null)?.focus(), 30);
  return modal;
}
