// JS/global-menu/top-header/col2.js
// Същата визия. Committed идва от CSV (AXP18days) за всички аксита.
// Днешният бар е live от __AXP_TOTALS__.

import {
    USD_PER_AXP, ensureStyles, nowLocal, monthKeyOf, getDaysInMonth, monthNameEnOf,
    buildCommittedFromCSV, getCurrentTotals, drawChart, formatUSD
} from './col2.core.js';

export function renderCol2(mount) {
    if (!mount) return;
    ensureStyles();

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

    // Data (Committed директно от CSV)
    let seriesCommitted = buildCommittedFromCSV(now); // сума от всички AXP18days редове за текущия месец
    const todayIdx = now.getDate() - 1;

    // Live overlay за днес
    const totals = getCurrentTotals();
    let seriesToDraw = seriesCommitted.slice();
    seriesToDraw[todayIdx] = Number(totals.today || 0);

    // Draw / resize
    let lastLayout = drawChart(canvas, seriesToDraw, { monthDays: currentMonthDays, todayIdx });
    const redraw = () => { lastLayout = drawChart(canvas, seriesToDraw, { monthDays: currentMonthDays, todayIdx }); };
    const ro = new ResizeObserver(() => redraw());
    ro.observe(canvasWrap);

    // При промяна на totals (напр. CSV loader е рефрешнал или live днес расте)
    document.addEventListener('axpTotalsUpdated', () => {
        // ако originalAxieData е презаредено, „Committed“ също се пресмята наново
        seriesCommitted = buildCommittedFromCSV(now);
        seriesToDraw = seriesCommitted.slice();
        const t = getCurrentTotals();
        seriesToDraw[todayIdx] = Number(t.today || 0);
        redraw();
    });

    // Tooltip
    canvas.addEventListener('mousemove', (e) => {
        if (!lastLayout) return;
        const rect = canvas.getBoundingClientRect();
        const { padL, padR, colW } = lastLayout;
        const innerW = canvas.clientWidth - padL - padR;

        const xRel = e.clientX - rect.left - padL;
        if (xRel < 0 || xRel > innerW) { tooltip.style.display = 'none'; return; }

        const idx = Math.min(currentMonthDays - 1, Math.max(0, Math.floor(xRel / colW)));
        const day = idx + 1;
        const val = Number(seriesToDraw[idx] ?? 0);
        const usd = val * USD_PER_AXP;

        tooltip.innerHTML = `Day ${day} — ${val.toLocaleString()} AXP<br>≈ ${formatUSD(usd)}`;
        tooltip.style.left = `${e.clientX - rect.left}px`;
        tooltip.style.top = `${e.clientY - rect.top}px`;
        tooltip.style.display = 'block';
    });
    canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
}
