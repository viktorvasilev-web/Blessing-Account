// JS/global-menu/menu.js
import {
  sortAxiesByLevel,
  sortAxiesByAXPToday
} from '/JS/global-menu/sorting-global-menu.js';

import { fetchLastCommitTime } from './lastUpdate.js';

/* ---------- helper: надеждно към число (покрива "889,246", "889 246", и т.н.) ---------- */
function toNum(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function setupGlobalMenu() {
  const container = document.getElementById('globalMenu');
  if (!container) return;

  container.innerHTML = `
  <div id="gm4" class="gm4">
    <section class="gm4-cell gm4-left" data-cell="left">
      <div class="gm4-count-stack">
        <div id="axieCountLabel">Axie Count: <span id="axieCount">0</span></div>
      </div>
    </section>

    <section class="gm4-cell gm4-controls" data-cell="controls">
      <div class="sort-controls" id="sortControls">
        <button id="sortAsc">⬇️ Level</button>
        <button id="sortDesc">⬆️ Level</button>
        <button id="sortAxpTodayAsc">⬇️ AXP/Today</button>
        <button id="sortAxpTodayDesc">⬆️ AXP/Today</button>
        <div id="lastUpdate" style="font-size: 12px; opacity: 0.6;">⏱️ Loading...</div>
      </div>
    </section>

    <section class="gm4-cell gm4-views" data-cell="views">
      <div id="totalAxpDisplay" style="margin-right: 12px; font-weight: bold; font-size: 14px;">
        📊 AXP Today: <span id="axpTodaySum">0</span>  📊 Yesterday: <span id="axpYestSum">0</span>
      </div>
      <div id="viewSwitcher" class="view-switcher"></div>
    </section>
  </div>
`;

  styleGrid();
  fetchLastCommitTime();

  const buttons = {
    sortAsc: document.getElementById('sortAsc'),
    sortDesc: document.getElementById('sortDesc'),
    sortAxpTodayAsc: document.getElementById('sortAxpTodayAsc'),
    sortAxpTodayDesc: document.getElementById('sortAxpTodayDesc'),
  };

  function clearActive() {
    Object.values(buttons).forEach(btn => btn.classList.remove('active'));
  }

  buttons.sortAsc?.addEventListener('click', () => {
    clearActive(); buttons.sortAsc.classList.add('active');
    sortAxiesByLevel('asc');
  });

  buttons.sortDesc?.addEventListener('click', () => {
    clearActive(); buttons.sortDesc.classList.add('active');
    sortAxiesByLevel('desc');
  });

  buttons.sortAxpTodayAsc?.addEventListener('click', () => {
    clearActive(); buttons.sortAxpTodayAsc.classList.add('active');
    sortAxiesByAXPToday('asc');
  });

  buttons.sortAxpTodayDesc?.addEventListener('click', () => {
    clearActive(); buttons.sortAxpTodayDesc.classList.add('active');
    sortAxiesByAXPToday('desc');
  });
}

export function updateAxieCount(count) {
  const countSpan = document.getElementById('axieCount');
  if (countSpan) countSpan.textContent = toNum(count).toLocaleString();
}

function styleGrid() {
  const gm = document.getElementById('gm4');
  if (!gm) return;

  gm.style.display = 'grid';
  gm.style.gridTemplateColumns = '1fr 2fr 1fr';
  gm.style.alignItems = 'center';
  gm.style.gap = '16px';

  const views = gm.querySelector('.gm4-views');
  if (views) {
    views.style.justifySelf = 'end';
    views.style.display = 'flex';
    views.style.justifyContent = 'flex-end';
  }

  const controls = gm.querySelector('.sort-controls');
  if (controls) {
    controls.style.display = 'flex';
    controls.style.gap = '10px';
  }
}

/* ---------------- AXP sums (Today / Yesterday) ---------------- */

export function updateDailyAXPDisplay(sumToday) { // back-compat
  const span = document.getElementById('axpTodaySum');
  if (span) span.textContent = toNum(sumToday).toLocaleString();
}

export function updateDailyAXPYesterdayDisplay(sumYest) {
  const span = document.getElementById('axpYestSum');
  if (span) span.textContent = toNum(sumYest).toLocaleString();
}

export function updateDailyAXPSummary({ today = 0, yesterday = 0 } = {}) {
  const t = toNum(today);
  const y = toNum(yesterday);

  // Обнови UI
  updateDailyAXPDisplay(t);
  updateDailyAXPYesterdayDisplay(y);

  // Разпространи към останалите компоненти (напр. графиката в col2)
  window.__AXP_TOTALS__ = { today: t, yesterday: y };
  document.dispatchEvent(new CustomEvent('axpTotalsUpdated', { detail: { today: t, yesterday: y } }));
}
