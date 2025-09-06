// JS/global-menu/top-header/col2.core.js
// Core помощници + четене на Committed директно от CSV (AXP18days)

/* ------------ Config ------------ */
export const CUT_HOUR = 3;   // 03:01 AM
export const CUT_MIN = 1;

// USD conversion based on example: 300,000 AXP = $0.24
export const USD_PER_300K_AXP = 0.24;
export const USD_PER_AXP = USD_PER_300K_AXP / 300000;

/* ------------ Time helpers (local time, assumed Europe/Sofia) ------------ */
export function nowLocal() { return new Date(); }
export function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
}
export function getDaysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}
export function monthKeyOf(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}
export function monthNameEnOf(d) {
    return d.toLocaleString('en-US', { month: 'long' });
}

/* ------------ Styles (prettier UI) ------------ */
export function ensureStyles() {
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
  .th-axp-canvas-wrap { width: 100%; height: 180px; position: relative; }
  .th-axp-legend {
    position: absolute; right: 6px; top: 6px; display: flex; gap: 12px;
    font-size: 11px; color: #cfd3da; opacity: .9;
  }
  .th-axp-dot { width:10px; height:10px; border-radius:3px; display:inline-block; vertical-align:middle; margin-right:6px; }
  .th-axp-tooltip {
    position: absolute; pointer-events: none; background: rgba(20,20,24,0.95); color: #e9edf3;
    border: 1px solid #30323a; padding: 6px 8px; font-size: 12px; border-radius: 8px;
    transform: translate(-50%, -120%); white-space: nowrap; box-shadow: 0 6px 18px rgba(0,0,0,.35);
    display: none;
  }`;
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
export const formatUSD = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6
}).format;

/* ------------ Chart (същият рендер) ------------ */
export function drawChart(canvas, series, { monthDays, todayIdx }) {
    const wrap = canvas.parentElement;
    const w = Math.max(360, wrap.clientWidth);
    const h = Math.max(160, wrap.clientHeight);
    const ctx = setupHiDPICanvas(canvas, w, h);

    ctx.clearRect(0, 0, w, h);

    const axisCol = '#aeb4c0';
    const gridCol = '#3a3f4a';
    const txtCol = '#cfd3da';

    const maxValData = Math.max(10, ...series.filter(v => v != null));
    const niceMax = niceNumber(maxValData, true);
    const yTicks = 5;
    const yStep = niceMax / yTicks;

    ctx.font = '11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    const labelW = ctx.measureText(niceMax.toLocaleString()).width;

    const padL = Math.max(44, 12 + labelW + 10);
    const padR = 16, padT = 14, padB = 34;

    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const yScale = innerH / niceMax;

    // axes
    ctx.lineWidth = 1;
    ctx.strokeStyle = axisCol;
    ctx.fillStyle = axisCol;
    drawArrow(ctx, padL, h - padB, w - padR, h - padB);
    drawArrow(ctx, padL, h - padB, padL, padT);

    // grid + Y labels
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = gridCol;
    ctx.fillStyle = txtCol;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 1; i <= yTicks; i++) {
        const val = i * yStep;
        const y = h - padB - val * yScale;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
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

    // bars
    const barMargin = Math.min(4, colW * 0.2);
    for (let i = 0; i < monthDays; i++) {
        const val = Number(series[i] ?? 0);
        const barH = Math.max(0, Math.min(innerH, val * yScale));
        const x = padL + i * colW + barMargin;
        const y = h - padB - barH;
        const wBar = Math.max(2, colW - barMargin * 2);

        const grad = ctx.createLinearGradient(0, y, 0, y + Math.max(1, barH));
        if (i === todayIdx) { grad.addColorStop(0, '#ffd08a'); grad.addColorStop(1, '#ff9f69'); }
        else { grad.addColorStop(0, '#8ab4ff'); grad.addColorStop(1, '#a0e9ff'); }
        ctx.fillStyle = grad;

        fillRoundedRect(ctx, x, y, wBar, barH, Math.min(6, wBar / 2, barH / 2));
    }

    return { padL, padR, padT, padB, innerW, innerH, colW };
}

/* ------------ CSV → Committed (НОВО) ------------ */
/**
 * Очаква всеки ред да има поле "AXP18days" (или "axp18days") със стойност:
 * "YYYY-MM-DD: N\nYYYY-MM-DD: N\n...".
 * Сумира по дата за всички редове и връща масив за текущия месец.
 */
export function buildCommittedFromCSV(baseDate = nowLocal()) {
    const rows = Array.isArray(window.originalAxieData) ? window.originalAxieData : [];
    const ym = monthKeyOf(baseDate);
    const daysInMonth = getDaysInMonth(baseDate.getFullYear(), baseDate.getMonth());

    // дата -> сума
    const totalByDate = new Map();

    for (const row of rows) {
        const raw = (row.AXP18days ?? row.axp18days ?? "").toString();
        if (!raw) continue;

        // Поддържаме както quoted блок, така и чисти редове
        const lines = raw
            .replace(/^"+|"+$/g, '') // махни водещи/завършващи кавички, ако има
            .split(/\r?\n/)
            .map(s => s.trim())
            .filter(Boolean);

        for (const ln of lines) {
            const m = /^(\d{4}-\d{2}-\d{2})\s*:\s*(\d+)/.exec(ln);
            if (!m) continue;
            const [_, dateStr, numStr] = m;
            if (!dateStr.startsWith(ym)) continue; // интересува ни само текущият месец

            const n = Number(numStr);
            if (!Number.isFinite(n)) continue;

            const prev = totalByDate.get(dateStr) || 0;
            totalByDate.set(dateStr, prev + n);
        }
    }

    // Превърни в month array (1..days)
    const out = new Array(daysInMonth).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${ym}-${String(day).padStart(2, '0')}`;
        if (totalByDate.has(dateStr)) out[day - 1] = totalByDate.get(dateStr);
    }
    return out;
}

/* ------------ Totals (live today) ------------ */
export function getCurrentTotals() {
    if (window.__AXP_TOTALS__ && typeof window.__AXP_TOTALS__.today === 'number') {
        return window.__AXP_TOTALS__;
    }
    // fallback — ако няма hook, връщаме нули
    return { today: 0, yesterday: 0 };
}
