// JS/global-menu/top-header/col2/totals.js
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

export function getCurrentTotals() {
    if (window.__AXP_TOTALS__ && typeof window.__AXP_TOTALS__.today === 'number') {
        return window.__AXP_TOTALS__;
    }
    return computeTotalsFromOriginalData();
}
