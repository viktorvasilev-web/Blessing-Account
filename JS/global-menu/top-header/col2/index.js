// JS/global-menu/top-header/col2/index.js
import { USD_PER_AXP, CUT_HOUR, CUT_MIN } from './config.js';
import { monthKeyOf, getDaysInMonth, monthNameEnOf, ymd } from './time.js';
import { drawChart } from './chart.js';

const formatUSD = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6
}).format;

/* ---------- safe number ---------- */
function toNum(v) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
}

/* ---------- UTC (GMT) ---------- */
const TZ = 'UTC';

/* Помощни: части от дата/час по UTC */
function partsUTC(dateObj = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    }).formatToParts(dateObj);
    const pick = t => Number(parts.find(p => p.type === t).value);
    return { y: pick('year'), m: pick('month'), d: pick('day'), h: pick('hour'), mi: pick('minute') };
}

/* Визуален „днес“ по UTC (денят се обръща в 00:00 UTC) */
function baseDateForView() {
    const { y, m, d } = partsUTC();
    // Създаваме локален Date със същите y/m/d; за нас важни са самите числа
    return new Date(y, m - 1, d);
}

/* „Вчера“ по UTC – за commit на Yesterday */
function yesterdayUTCDate() {
    const { y, m, d } = partsUTC();
    return new Date(y, m - 1, d - 1);
}

/* ---------- raw localStorage I/O ---------- */
function readSeriesRaw(monthKey, days) {
    try {
        const raw = localStorage.getItem(`axp_daily_${monthKey}`);
        const arr = raw ? JSON.parse(raw) : [];
        const out = Array.isArray(arr) ? arr.slice(0, days) : [];
        while (out.length < days) out.push(null);
        return out;
    } catch { return new Array(days).fill(null); }
}
function writeSeriesRaw(monthKey, arr) {
    try { localStorage.setItem(`axp_daily_${monthKey}`, JSON.stringify(arr)); } catch { }
}

/* ---------- commit yesterday (replace only if bigger) ---------- */
function commitYesterdayDirect(yValInput) {
    const yVal = toNum(yValInput);
    if (!(yVal > 0)) return null;

    const yDate = yesterdayUTCDate();           // <-- UTC „вчера“
    const mKey = monthKeyOf(yDate);
    const days = getDaysInMonth(yDate.getFullYear(), yDate.getMonth());
    const idx = yDate.getDate() - 1;

    const serie = readSeriesRaw(mKey, days);
    const prev = toNum(serie[idx]);
    const next = Math.max(prev, yVal);
    if (serie[idx] == null || next !== prev) {
        serie[idx] = next;
        writeSeriesRaw(mKey, serie);
        try { localStorage.setItem('axp_last_yesterday_committed_ymd', ymd(yDate)); } catch { }
    }
    return { key: mKey, idx, val: next };
}

/* ---------- render ---------- */
export function renderCol2(mount) {
    if (!mount) return;

    // визуален ден по UTC
    const base = baseDateForView();
    const monthKey = monthKeyOf(base);
    const monthDays = getDaysInMonth(base.getFullYear(), base.getMonth());
    const todayIdx = base.getDate() - 1;
    const titleStr = `${monthNameEnOf(base)} ${base.getFullYear()} – AXP / Daily (UTC)`;

    // UI
    const wrapper = document.createElement('div'); wrapper.className = 'th-axp';
    const title = document.createElement('div'); title.className = 'th-axp-title'; title.textContent = titleStr;
    const canvasWrap = document.createElement('div'); canvasWrap.className = 'th-axp-canvas-wrap';
    const legend = document.createElement('div'); legend.className = 'th-axp-legend';
    legend.innerHTML = `
    <div><span class="th-axp-dot" style="background:linear-gradient(180deg,#8ab4ff,#a0e9ff)"></span>Committed</div>
    <div><span class="th-axp-dot" style="background:linear-gradient(180deg,#ffd08a,#ff9f69)"></span>Today (live)</div>`;
    const tooltip = document.createElement('div'); tooltip.className = 'th-axp-tooltip';
    const canvas = document.createElement('canvas');
    canvasWrap.appendChild(canvas); canvasWrap.appendChild(legend); canvasWrap.appendChild(tooltip);
    wrapper.appendChild(title); wrapper.appendChild(canvasWrap);
    mount.innerHTML = ''; mount.appendChild(wrapper);

    // данни
    let committed = readSeriesRaw(monthKey, monthDays);
    const totals0 = window.__AXP_TOTALS__ || { today: 0, yesterday: 0 };
    let seriesToDraw = committed.slice();

    // live today (UTC ден)
    seriesToDraw[todayIdx] = toNum(totals0.today);

    // commit & draw вчера (ако е в същия месец)
    const c0 = commitYesterdayDirect(totals0.yesterday);
    if (c0 && c0.key === monthKey) {
        committed[c0.idx] = c0.val;
        seriesToDraw[c0.idx] = c0.val;
    }

    // draw
    let lastLayout = drawChart(canvas, seriesToDraw, { monthDays, todayIdx });
    const redraw = () => { lastLayout = drawChart(canvas, seriesToDraw, { monthDays, todayIdx }); };
    ('ResizeObserver' in window) ? new ResizeObserver(() => redraw()).observe(canvasWrap) : window.addEventListener('resize', redraw);

    // on updates: today + commit вчера
    document.addEventListener('axpTotalsUpdated', (ev) => {
        const t = ev?.detail || window.__AXP_TOTALS__ || {};
        seriesToDraw[todayIdx] = toNum(t.today);
        const info = commitYesterdayDirect(t.yesterday);
        if (info && info.key === monthKey) {
            committed[info.idx] = info.val;
            seriesToDraw[info.idx] = info.val;
        }
        redraw();
    });

    // safety: периодично опитвай, ако по-късно се появи Yesterday>0
    const tick = () => {
        const t = window.__AXP_TOTALS__ || {};
        const info = commitYesterdayDirect(t.yesterday);
        if (info && info.key === monthKey) {
            committed[info.idx] = info.val;
            seriesToDraw[info[idx]] = info.val;
            redraw();
        }
    };
    setInterval(tick, 15 * 1000);

    // tooltip
    canvas.addEventListener('mousemove', (e) => {
        if (!lastLayout) return;
        const rect = canvas.getBoundingClientRect();
        const { padL, padR, colW } = lastLayout;
        const innerW = canvas.clientWidth - padL - padR;
        const xRel = e.clientX - rect.left - padL;
        if (xRel < 0 || xRel > innerW) { tooltip.style.display = 'none'; return; }
        const idx = Math.min(monthDays - 1, Math.max(0, Math.floor(xRel / colW)));
        const day = idx + 1;
        const val = toNum(seriesToDraw[idx]);
        const usd = val * USD_PER_AXP;
        tooltip.innerHTML = `Day ${day} — ${val.toLocaleString()} AXP<br>≈ ${formatUSD(usd)} (UTC)`;
        tooltip.style.left = `${e.clientX - rect.left}px`;
        tooltip.style.top = `${e.clientY - rect.top}px`;
        tooltip.style.display = 'block';
    });
    canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
}
