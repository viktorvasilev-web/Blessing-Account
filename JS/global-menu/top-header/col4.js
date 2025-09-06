// JS/global-menu/top-header/col4.js
// AXP Total Earnings (колона 4) = сумата на това, което е на графиката за текущия месец:
// Committed (CSV/AXP18days) за всички дни + live Today от __AXP_TOTALS__.

const USD_PER_300K_AXP = 0.24;
const USD_PER_AXP = USD_PER_300K_AXP / 300000;

/* >>> EDIT THESE MARGINS IF NEEDED <<< */
const LEFT_NUDGE = -12; // px
const RIGHT_NUDGE = 84; // px

/* ---------- Time helpers ---------- */
function nowLocal() { return new Date(); }
function getDaysInMonth(y, mIndex) { return new Date(y, mIndex + 1, 0).getDate(); }
function monthKeyOf(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function monthNameEnOf(d) { return d.toLocaleString('en-US', { month: 'long' }); }

/* ---------- Totals helpers ---------- */
function computeTotalsFromOriginalData() {
  const data = Array.isArray(window.originalAxieData) ? window.originalAxieData : [];
  return data.reduce((acc, row) => {
    const s = (row.AXPtoday || row.axptoday || "").toString();
    const m = /Today:\s*(\d+)\s*,\s*Yesterday:\s*(\d+)/i.exec(s);
    if (m) { acc.today += Number(m[1]); acc.yesterday += Number(m[2]); }
    return acc;
  }, { today: 0, yesterday: 0 });
}
function getCurrentTotals() {
  if (window.__AXP_TOTALS__ && typeof window.__AXP_TOTALS__.today === 'number') {
    return window.__AXP_TOTALS__;
  }
  return computeTotalsFromOriginalData();
}

/* ---------- CSV → committed масив за текущия месец ---------- */
function buildCommittedFromCSV(baseDate = nowLocal()) {
  const rows = Array.isArray(window.originalAxieData) ? window.originalAxieData : [];
  const ym = monthKeyOf(baseDate);
  const daysInMonth = getDaysInMonth(baseDate.getFullYear(), baseDate.getMonth());
  const totalByDate = new Map();

  for (const row of rows) {
    const raw = (row.AXP18days ?? row.axp18days ?? "").toString();
    if (!raw) continue;

    const lines = raw.replace(/^"+|"+$/g, '')
      .split(/\r?\n/).map(s => s.trim()).filter(Boolean);

    for (const ln of lines) {
      const m = /^(\d{4}-\d{2}-\d{2})\s*:\s*(\d+)/.exec(ln);
      if (!m) continue;
      const [, dateStr, numStr] = m;
      if (!dateStr.startsWith(ym)) continue;
      const n = Number(numStr);
      if (!Number.isFinite(n)) continue;
      totalByDate.set(dateStr, (totalByDate.get(dateStr) || 0) + n);
    }
  }

  const out = new Array(daysInMonth).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const d = `${ym}-${String(day).padStart(2, '0')}`;
    if (totalByDate.has(d)) out[day - 1] = totalByDate.get(d);
  }
  return out;
}

/* ---------- Styles ---------- */
function ensureCol4Styles() {
  const old = document.getElementById('col4EarningsStyles');
  if (old) old.remove();
  const css = `
  :root{ --c4-right-nudge:0px; --c4-left-nudge:0px; }
  .th-col4{ margin-right:var(--c4-right-nudge)!important; margin-left:var(--c4-left-nudge)!important; min-width:0; justify-self:end; }
  .c4{ --text:#e9ebf1; --muted:#b9bfcb; width:100%; display:flex; flex-direction:column; align-items:flex-start; gap:8px; }
  .c4__title{ margin:0; padding:0; font-size:15px; font-weight:700; letter-spacing:.2px; color:var(--text); }
  .c4__rate{ margin:0; font-size:12px; color:var(--muted); }
  .c4__label{ margin:8px 0 0 0; font-size:12px; color:var(--muted); }
  .c4__values{ margin:0; font-size:14px; font-weight:600; color:var(--text); white-space:nowrap; }
  .c4__values .usd{ color:#dfe3ea; opacity:.95; margin-left:6px; }
  `;
  const style = document.createElement('style');
  style.id = 'col4EarningsStyles';
  style.textContent = css;
  document.head.appendChild(style);
}
function applyNudges() {
  document.documentElement.style.setProperty('--c4-left-nudge', `${LEFT_NUDGE}px`);
  document.documentElement.style.setProperty('--c4-right-nudge', `${RIGHT_NUDGE}px`);
}

/* ---------- Точно същото като на графиката ---------- */
function calcMonthAXPAndUSD() {
  const now = nowLocal();
  const todayIdx = now.getDate() - 1;

  // 1) committed за текущия месец от CSV
  const series = buildCommittedFromCSV(now);

  // 2) override за днес с live today (както прави графиката)
  const totals = getCurrentTotals();
  series[todayIdx] = Number(totals.today || 0);

  // 3) сума на всичко видимо на графиката
  const axpMonth = series.reduce((s, v) => s + (Number.isFinite(v) ? Number(v) : 0), 0);

  const usdMonth = axpMonth * USD_PER_AXP;
  const monthLabel = `${monthNameEnOf(now)} ${now.getFullYear()}`;
  return { axpMonth, usdMonth, monthLabel };
}

/* ---------- Render ---------- */
export function renderCol4(mount) {
  if (!mount) return;
  ensureCol4Styles();
  applyNudges();

  const root = document.createElement('div');
  root.className = 'c4';

  const title = document.createElement('h2');
  title.className = 'c4__title';
  title.textContent = 'AXP Total Earnings:';

  const rate = document.createElement('p');
  rate.className = 'c4__rate';
  rate.textContent = '300,000 AXP = $0.24';

  const label = document.createElement('p');
  label.className = 'c4__label';
  label.id = 'c4-month-label';

  const values = document.createElement('p');
  values.className = 'c4__values';
  values.innerHTML = `<span id="c4-axp"></span><span class="usd" id="c4-usd"></span>`;

  root.appendChild(title);
  root.appendChild(rate);
  root.appendChild(label);
  root.appendChild(values);

  mount.innerHTML = '';
  mount.appendChild(root);

  const fmtUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function update() {
    const { axpMonth, usdMonth, monthLabel } = calcMonthAXPAndUSD();
    const labelEl = document.getElementById('c4-month-label');
    const axpEl = document.getElementById('c4-axp');
    const usdEl = document.getElementById('c4-usd');

    if (labelEl) labelEl.textContent = `AXP for ${monthLabel}:`;
    if (axpEl) axpEl.textContent = axpMonth.toLocaleString();
    if (usdEl) usdEl.textContent = ` ≈ ${fmtUSD.format(usdMonth)}`;
  }

  update();
  // обновявай при live hook и периодично за всеки случай
  document.addEventListener('axpTotalsUpdated', update);
  setInterval(update, 60 * 1000);
}
