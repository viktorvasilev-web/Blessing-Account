// JS/global-menu/top-header/col4.js
// Simple AXP Total Earnings — без кутии, вертикално отгоре-надолу.
// Структура:
// AXP Total Earnings:
//
// 300,000 AXP = $0.24
//
// AXP for {Month Year}:
// {AXP} ≈ {USD}

const USD_PER_300K_AXP = 0.24;
const USD_PER_AXP = USD_PER_300K_AXP / 300000;

/* >>> EDIT THESE MARGINS IF NEEDED <<< */
const LEFT_NUDGE = -12; // px (по-отрицателно = по-близо към колона 3)
const RIGHT_NUDGE = 84;  // px

/* ---------- Time helpers ---------- */
function nowLocal() { return new Date(); }
function getDaysInMonth(y, mIndex) { return new Date(y, mIndex + 1, 0).getDate(); }
function monthKeyOf(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function monthNameEnOf(d) { return d.toLocaleString('en-US', { month: 'long' }); }

/* ---------- Storage (shared with Col 2) ---------- */
function storageKeyForMonth(k) { return `axp_daily_${k}`; }
function loadSeriesForMonth(monthKey, days) {
    try {
        const raw = localStorage.getItem(storageKeyForMonth(monthKey));
        if (!raw) return new Array(days).fill(null);
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return new Array(days).fill(null);
        const out = arr.slice(0, days);
        while (out.length < days) out.push(null);
        return out;
    } catch { return new Array(days).fill(null); }
}

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

/* ---------- Styles ---------- */
function ensureCol4Styles() {
    // replace previous style to ensure fresh margins
    const old = document.getElementById('col4EarningsStyles');
    if (old) old.remove();

    const css = `
  :root{
    --c4-right-nudge: 0px;
    --c4-left-nudge:  0px;
  }
  .th-col4{
    margin-right: var(--c4-right-nudge) !important;
    margin-left:  var(--c4-left-nudge)  !important;
    min-width: 0;
    justify-self: end;
  }

  .c4{
    --text:  #e9ebf1;
    --muted: #b9bfcb;

    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start; /* top-left start */
    gap: 8px;
  }

  .c4__title{
    margin: 0;
    padding: 0;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: .2px;
    color: var(--text);
  }

  .c4__rate{
    margin: 0;
    font-size: 12px;
    color: var(--muted);
  }

  .c4__label{
    margin: 8px 0 0 0;
    font-size: 12px;
    color: var(--muted);
  }

  .c4__values{
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
  }
  .c4__values .usd{
    color: #dfe3ea;
    opacity: .95;
    margin-left: 6px;
  }
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

/* ---------- Compute month AXP & USD ---------- */
function calcMonthAXPAndUSD() {
    const now = nowLocal();
    const monthKey = monthKeyOf(now);
    const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());
    const committed = loadSeriesForMonth(monthKey, daysInMonth);
    const todayIdx = now.getDate() - 1;

    // sum committed except today (today is live)
    const committedSum = committed.reduce((sum, v, idx) => {
        if (idx === todayIdx) return sum;
        return sum + (v == null ? 0 : Number(v) || 0);
    }, 0);

    const totals = getCurrentTotals();
    const liveToday = committed[todayIdx] == null ? Number(totals.today || 0) : 0;

    const axpMonth = committedSum + liveToday;
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
        if (axpEl) axpEl.textContent = `${axpMonth.toLocaleString()}`;
        if (usdEl) usdEl.textContent = ` ≈ ${fmtUSD.format(usdMonth)}`;
    }

    update();
    document.addEventListener('axpTotalsUpdated', update);
    setInterval(update, 60 * 1000);
}
