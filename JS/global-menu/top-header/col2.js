// JS/global-menu/top-header/col2.js
// Merged center (columns 2+3) — AXP / Daily chart for the CURRENT month.
// Locks "yesterday" after 03:01 AM local (BG) by taking AXP/Yesterday,
// and shows today's bar live from AXP/Today. If page was closed at 03:01,
// fills yesterday on the first load after 03:01.
//
// Requires the hook from csv-loader.js:
//   window.__AXP_TOTALS__ = totals;
//   document.dispatchEvent(new CustomEvent('axpTotalsUpdated', { detail: totals }));

/* ------------ Config ------------ */
const CUT_HOUR = 3;   // 03:01 AM
const CUT_MIN = 1;

// USD conversion based on example: 300,000 AXP = $0.24
const USD_PER_300K_AXP = 0.24;
const USD_PER_AXP = USD_PER_300K_AXP / 300000;

/* ------------ Time helpers (local time, assumed Europe/Sofia) ------------ */
function nowLocal() { return new Date(); }
function todayCutoff() {
    const n = nowLocal();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate(), CUT_HOUR, CUT_MIN, 0, 0);
}
function msUntilNextCutoff() {
    const n = nowLocal();
    const cut = todayCutoff();
    if (n < cut) return cut - n;
    const tmr = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, CUT_HOUR, CUT_MIN, 0, 0);
    return tmr - n;
}
function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
}

/* ------------ Month helpers ------------ */
function getDaysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}
function monthKeyOf(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}
function monthNameEnOf(d) {
    return d.toLocaleString('en-US', { month: 'long' });
}

/* ------------ Storage helpers ------------ */
function storageKeyForMonth(keyStr) { return `axp_daily_${keyStr}`; }
const COMMIT_MARKER_KEY = 'axp_last_yesterday_committed_ymd';

function loadSeriesForMonth(monthKey, days) {
    try {
        const raw = localStorage.getItem(storageKeyForMonth(monthKey));
        if (!raw) return new Array(days).fill(null);
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return new Array(days).fill(null);
        const out = arr.slice(0, days);
        while (out.length < days) out.push(null);
        return out;
    } catch {
        return new Array(days).fill(null);
    }
}
function saveSeriesForMonth(monthKey, series) {
    try { localStorage.setItem(storageKeyForMonth(monthKey), JSON.stringify(series)); } catch { }
}
function getCommitMarker() {
    try { return localStorage.getItem(COMMIT_MARKER_KEY) || ''; } catch { return ''; }
}
function setCommitMarker(ymdStr) {
    try { localStorage.setItem(COMMIT_MARKER_KEY, ymdStr); } catch { }
}

/* ------------ Get totals (from page) ------------ */
function computeTotalsFromOriginalData() {
    const data = Array.isArray(window.originalAxieData) ? window.originalAxieData : [];
    return data.reduce((acc, row) => {
        const s = (row.AXPtoday || row.axptoday || "").toString();
        const m = /Today:\s*(\d+)\s*,\s*Yesterday:\s*(\d+)/i.exec(s);
        if (m) {
            acc.today += Number(m[1]);
            acc.yesterday += Number(m[2]);
        }
        return acc;
    }, { today: 0, yesterday: 0 });
}
function getCurrentTotals() {
    if (window.__AXP_TOTALS__ && typeof window.__AXP_TOTALS__.today === 'number') {
        return window.__AXP_TOTALS__;
    }
    return computeTotalsFromOriginalData();
}

/* ------------ Commit yesterday after 03:01 ------------ */
function commitYesterdayIfNeeded() {
    const n = nowLocal();
    const cut = todayCutoff();
    if (n < cut) return;

    const yesterday = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1);
    const yesterdayYMD = ymd(yesterday);
    if (getCommitMarker() === yesterdayYMD) return;

    const totals = getCurrentTotals();
    const val = Number(totals.yesterday || 0);

    const yMonthKey = monthKeyOf(yesterday);
    const yDays = getDaysInMonth(yesterday.getFullYear(), yesterday.getMonth());
    const series = loadSeriesForMonth(yMonthKey, yDays);
    const idx = yesterday.getDate() - 1;
    series[idx] = val;
    saveSeriesForMonth(yMonthKey, series);

    setCommitMarker(yesterdayYMD);
}

/* ------------ Styles (prettier UI) ------------ */
function ensureStyles() {
    if (document.getElementById('thAxpChartStyles')) return;
    const css = `
  .th-axp {
    width: 100%;
    background: radial-gradient(120% 100% at 0% 0%, #1e1e25 0%, #17171b 60%, #141417 100%);
    border: 1px solid #2b2b31;
    border-radius: 14px;
    padding: 12px 14px;
    box-shadow: 0 10px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03);
    backdrop-filter: blur(2px);
  }
  .th-axp-title {
    font-weight: 600;
    font-size: 14px;
    color: #f0f1f3;
    margin: 0 0 10px 0;
    text-align: center;
    letter-spacing: .2px;
  }
  .th-axp-canvas-wrap {
    width: 100%;
    height: 180px;
    position: relative;
  }
  .th-axp-legend {
    position: absolute;
    right: 6px;
    top: 6px;
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: #cfd3da;
    opacity: .9;
  }
  .th-axp-dot { width:10px; height:10px; border-radius:3px; display:inline-block; vertical-align:middle; margin-right:6px; }
  .th-axp-tooltip {
    position: absolute;
    pointer-events: none;
    background: rgba(20,20,24,0.95);
    color: #e9edf3;
    border: 1px solid #30323a;
    padding: 6px 8px;
    font-size: 12px;
    border-radius: 8px;
    transform: translate(-50%, -120%);
    white-space: nowrap;
    box-shadow: 0 6px 18px rgba(0,0,0,.35);
    display: none;
  }
  `;
    const style = document.createElement('style');
    style.id = 'thAxpChartStyles';
    style.textContent = css;
    document.head.appendChild(style);
}

/* ------------ Canvas helpers ------------ */
function setupHiDPICanvas(canvas, widthCSS, heightCSS) {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${widthCSS}px`;
    canvas.style.height = `${heightCSS}px`;
    canvas.width = Math.round(widthCSS * dpr);
    canvas.height = Math.round(heightCSS * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
}
function drawArrow(ctx, fromX, fromY, toX, toY) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const len = 6;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - len * Math.cos(angle - Math.PI / 6), toY - len * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - len * Math.cos(angle + Math.PI / 6), toY - len * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}
function fillRoundedRect(ctx, x, y, w, h, r) {
    if (h <= 0 || w <= 0) return;
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}
function niceNumber(range, round) {
    const exponent = Math.floor(Math.log10(range || 1));
    const fraction = (range || 1) / Math.pow(10, exponent);
    let niceFraction;
    if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
    } else {
        if (fraction <= 1) niceFraction = 1;
        else if (fraction <= 2) niceFraction = 2;
        else if (fraction <= 5) niceFraction = 5;
        else niceFraction = 10;
    }
    return niceFraction * Math.pow(10, exponent);
}
const formatUSD = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6
}).format;

/* ------------ Drawing (returns layout for tooltips) ------------ */
function drawChart(canvas, series, { monthDays, todayIdx }) {
    const wrap = canvas.parentElement;
    const w = Math.max(360, wrap.clientWidth);
    const h = Math.max(160, wrap.clientHeight);
    const ctx = setupHiDPICanvas(canvas, w, h);

    ctx.clearRect(0, 0, w, h);

    // Palette
    const axisCol = '#aeb4c0';
    const gridCol = '#3a3f4a';
    const txtCol = '#cfd3da';

    // Determine scale first
    const maxValData = Math.max(10, ...series.filter(v => v != null));
    const niceMax = niceNumber(maxValData, true);
    const yTicks = 5;
    const yStep = niceMax / yTicks;

    // We need font set before measureText
    ctx.font = '11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    const maxLabel = niceMax.toLocaleString();
    const labelW = ctx.measureText(maxLabel).width;

    // Dynamic paddings (ensure labels are fully visible)
    const padL = Math.max(44, 12 + labelW + 10); // 12px margin + label width + 10px gap
    const padR = 16, padT = 14, padB = 34;

    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const yScale = innerH / niceMax;

    // Axes with arrows
    ctx.lineWidth = 1;
    ctx.strokeStyle = axisCol;
    ctx.fillStyle = axisCol;
    drawArrow(ctx, padL, h - padB, w - padR, h - padB); // X →
    drawArrow(ctx, padL, h - padB, padL, padT);          // Y ↑

    // Grid + Y labels
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = gridCol;
    ctx.fillStyle = txtCol;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 1; i <= yTicks; i++) {
        const val = i * yStep;
        const y = h - padB - val * yScale;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        ctx.fillText(val.toLocaleString(), padL - 8, y);
    }
    ctx.setLineDash([]);

    // X labels
    ctx.fillStyle = txtCol;
    ctx.font = '10px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const colW = innerW / monthDays;
    for (let d = 1; d <= monthDays; d++) {
        const xCenter = padL + (d - 0.5) * colW;
        ctx.fillText(String(d), xCenter, h - padB + 6);
    }

    // Bars (rounded, gradient)
    const barMargin = Math.min(4, colW * 0.2);
    for (let i = 0; i < monthDays; i++) {
        const val = series[i] ?? 0;
        const barH = Math.max(0, Math.min(innerH, val * yScale));
        const x = padL + i * colW + barMargin;
        const y = h - padB - barH;
        const wBar = Math.max(2, colW - barMargin * 2);

        // style: today accent, else normal
        if (i === todayIdx) {
            const grad = ctx.createLinearGradient(0, y, 0, y + barH);
            grad.addColorStop(0, '#ffd08a');
            grad.addColorStop(1, '#ff9f69');
            ctx.fillStyle = grad;
        } else {
            const grad = ctx.createLinearGradient(0, y, 0, y + barH);
            grad.addColorStop(0, '#8ab4ff');
            grad.addColorStop(1, '#a0e9ff');
            ctx.fillStyle = grad;
        }

        fillRoundedRect(ctx, x, y, wBar, barH, Math.min(6, wBar / 2, barH / 2));
    }

    // return layout for tooltip math
    return { padL, padR, padT, padB, innerW, innerH, colW };
}

/* ------------ Main render ------------ */
export function renderCol2(mount) {
    if (!mount) return;
    ensureStyles();

    // Try commit immediately if after 03:01, then schedule next commits
    commitYesterdayIfNeeded();
    setTimeout(() => {
        commitYesterdayIfNeeded();
        setInterval(commitYesterdayIfNeeded, 24 * 60 * 60 * 1000);
    }, msUntilNextCutoff() + 250);

    const now = nowLocal();
    const currentMonthKey = monthKeyOf(now);
    const currentMonthDays = getDaysInMonth(now.getFullYear(), now.getMonth());
    const monthName = monthNameEnOf(now);
    const year = now.getFullYear();

    // UI
    const wrapper = document.createElement('div');
    wrapper.className = 'th-axp';

    const title = document.createElement('div');
    title.className = 'th-axp-title';
    title.textContent = `${monthName} ${year} – AXP / Daily`;

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'th-axp-canvas-wrap';

    const legend = document.createElement('div');
    legend.className = 'th-axp-legend';
    legend.innerHTML = `
    <div><span class="th-axp-dot" style="background:linear-gradient(180deg,#8ab4ff,#a0e9ff)"></span>Committed</div>
    <div><span class="th-axp-dot" style="background:linear-gradient(180deg,#ffd08a,#ff9f69)"></span>Today (live)</div>
  `;

    const tooltip = document.createElement('div');
    tooltip.className = 'th-axp-tooltip';

    const canvas = document.createElement('canvas');
    canvasWrap.appendChild(canvas);
    canvasWrap.appendChild(legend);
    canvasWrap.appendChild(tooltip);

    wrapper.appendChild(title);
    wrapper.appendChild(canvasWrap);

    mount.innerHTML = '';
    mount.appendChild(wrapper);

    // Data
    let seriesCommitted = loadSeriesForMonth(currentMonthKey, currentMonthDays);
    const todayIdx = now.getDate() - 1;

    // Live overlay
    const totals = getCurrentTotals();
    let seriesToDraw = seriesCommitted.slice();
    seriesToDraw[todayIdx] = Number(totals.today || 0);

    // Draw / resize (keep last layout for tooltip math)
    let lastLayout = drawChart(canvas, seriesToDraw, { monthDays: currentMonthDays, todayIdx });
    const redraw = () => { lastLayout = drawChart(canvas, seriesToDraw, { monthDays: currentMonthDays, todayIdx }); };
    const ro = new ResizeObserver(() => redraw());
    ro.observe(canvasWrap);

    // Live updates
    document.addEventListener('axpTotalsUpdated', (ev) => {
        const t = ev?.detail || getCurrentTotals();
        seriesToDraw[todayIdx] = Number(t.today || 0);
        redraw();
    });

    // Tooltip logic (uses dynamic padL/colW from lastLayout)
    canvas.addEventListener('mousemove', (e) => {
        if (!lastLayout) return;
        const rect = canvas.getBoundingClientRect();
        const { padL, padR, colW } = lastLayout;
        const innerW = canvas.clientWidth - padL - padR;

        const xRel = e.clientX - rect.left - padL;
        if (xRel < 0 || xRel > innerW) {
            tooltip.style.display = 'none';
            return;
        }
        const idx = Math.min(currentMonthDays - 1, Math.max(0, Math.floor(xRel / colW)));
        const day = idx + 1;
        const val = seriesToDraw[idx] ?? 0;

        // USD conversion second line
        const usd = val * USD_PER_AXP;

        tooltip.innerHTML = `Day ${day} — ${Number(val).toLocaleString()} AXP<br>≈ ${formatUSD(usd)}`;
        tooltip.style.left = `${e.clientX - rect.left}px`;
        tooltip.style.top = `${e.clientY - rect.top}px`;
        tooltip.style.display = 'block';
    });
    canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
}
