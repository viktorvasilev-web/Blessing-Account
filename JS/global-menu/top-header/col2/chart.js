// JS/global-menu/top-header/col2/chart.js
import { setupHiDPICanvas, drawArrow, fillRoundedRect, niceNumber } from './canvas-utils.js';

export function drawChart(canvas, series, { monthDays, todayIdx }) {
    const wrap = canvas.parentElement;
    const w = Math.max(360, wrap.clientWidth);
    const h = Math.max(160, wrap.clientHeight);
    const ctx = setupHiDPICanvas(canvas, w, h);

    ctx.clearRect(0, 0, w, h);

    // Palette
    const axisCol = '#aeb4c0';
    const gridCol = '#3a3f4a';
    const txtCol = '#cfd3da';

    // Scale
    const maxValData = Math.max(10, ...series.filter(v => v != null));
    const niceMax = niceNumber(maxValData, true);
    const yTicks = 5;
    const yStep = niceMax / yTicks;

    // Fonts before measureText
    ctx.font = '11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    const maxLabel = niceMax.toLocaleString();
    const labelW = ctx.measureText(maxLabel).width;

    // Dynamic paddings
    const padL = Math.max(44, 12 + labelW + 10);
    const padR = 16, padT = 14, padB = 34;

    const innerW = w - padL - padR;
    const innerH = h - padT - padB;
    const yScale = innerH / niceMax;

    // Axes
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

    // layout за tooltip
    return { padL, padR, padT, padB, innerW, innerH, colW };
}
