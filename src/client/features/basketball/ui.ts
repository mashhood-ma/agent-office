import type { BasketballRecords } from './records';
import { h, openModal, type Modal } from '../../ui/dom';
import './ui.css';

export interface BasketballRecordsModalDeps {
  records: BasketballRecords;
  onReset: () => void;
}

/** Opens the personal basketball records modal. */
export function openBasketballRecords(deps: BasketballRecordsModalDeps): Modal {
  const { records, onReset } = deps;
  const close = h('button.btn.close', { 'aria-label': 'Close' }, '✕');

  const statTile = (icon: string, label: string, value: string | number, highlight = false) =>
    h(
      'div.stat-tile',
      { class: highlight ? 'highlight' : '' },
      h('div.stat-icon', {}, icon),
      h('div.stat-val', {}, String(value)),
      h('div.stat-lbl', {}, label),
    );

  const grid = h(
    'div.basketball-stat-grid',
    {},
    statTile('🔥', 'Current Streak', records.streak > 0 ? `${records.streak} in a row` : '0', records.streak > 1),
    statTile('🏆', 'Best Streak', `${records.bestStreak} in a row`, records.bestStreak > 0),
    statTile('🎯', 'Longest Shot', records.longestShot > 0 ? `${records.longestShot.toFixed(1)} m` : '—', records.longestShot > 0),
    statTile('🏀', 'Total Baskets', records.totalBaskets),
    statTile('✨', '3-Pointers (>6.75m)', records.threePointers),
    statTile('💨', 'Swishes', records.swishes),
    statTile('🧱', 'Off The Glass', records.banks),
  );

  const resetBtn = h('button.btn.btn-subtle', { type: 'button' }, 'Reset records');
  resetBtn.addEventListener('click', () => {
    if (confirm('Reset your basketball stats and records back to zero?')) {
      onReset();
      modal.close();
    }
  });

  const el = h(
    'div.modal.basketball-records-modal',
    { role: 'dialog', 'aria-label': 'Basketball Records' },
    h('header', {}, h('h2', {}, '🏀 Basketball Records'), close),
    h(
      'div.body',
      {},
      h('p.setting-note', {}, 'Your personal shooting records and lifetime stats, saved in this browser.'),
      grid,
      h('div.modal-foot', {}, resetBtn),
    ),
  );

  const modal = openModal(el, { closeButton: false });
  close.addEventListener('click', () => modal.close());
  return modal;
}
