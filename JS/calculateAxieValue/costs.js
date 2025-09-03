export const DEFAULT_SELL_FEE_PCT = 0.0425;
export const DEFAULT_ACQUISITION_USD = 5;

export function round2(x) {
    const n = Number(x);
    if (!Number.isFinite(n)) return 0;
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function toNumber(val) {
    if (typeof val === 'number') return val;
    if (val == null) return NaN;
    let s = String(val).trim();
    if (s === '') return NaN;
    s = s.replace(/%/g, '');
    s = s.replace(/[^0-9.,-]/g, '');
    if (s.includes('.') && s.includes(',')) {
        s = s.replace(/,/g, '');
    } else if (s.includes(',') && !s.includes('.')) {
        s = s.replace(',', '.');
    }
    return parseFloat(s);
}

export function isFiniteNumber(n) {
    return typeof n === 'number' && Number.isFinite(n);
}

export function normalizePercent(pctMaybe, fallback = DEFAULT_SELL_FEE_PCT) {
    const n = toNumber(pctMaybe);
    if (isFiniteNumber(n)) return n > 1 ? n / 100 : n;
    const fb = toNumber(fallback);
    if (isFiniteNumber(fb)) return fb > 1 ? fb / 100 : fb;
    return DEFAULT_SELL_FEE_PCT;
}

export function getAscendCostUSD(level) {
    const L = Math.max(0, parseInt(level, 10) || 0);
    if (L >= 60) return 10.55;
    if (L >= 50) return 7.55;
    if (L >= 40) return 5.05;
    if (L >= 30) return 3.05;
    if (L >= 20) return 1.55;
    if (L >= 10) return 0.55;
    return 0.0;
}

export function computeSellFeeUSD(minValueUSD, feePct = DEFAULT_SELL_FEE_PCT, { rounded = false } = {}) {
    const mv = toNumber(minValueUSD);
    const p = normalizePercent(feePct);
    if (!isFiniteNumber(mv) || !isFiniteNumber(p) || mv <= 0 || p <= 0) return 0;
    const fee = mv * p;
    return rounded ? round2(fee) : fee;
}

export function computeAcquisitionUSD(overrideUSD, { rounded = false } = {}) {
    const n = toNumber(overrideUSD);
    const val = (isFiniteNumber(n) && n >= 0) ? n : DEFAULT_ACQUISITION_USD;
    return rounded ? round2(val) : val;
}

export function computeCosts({
    id,
    level,
    minValueUSD,
    sellFeePct,
    acquisitionOverride,
    round = false,
} = {}) {
    let ascendUSD;

    // 🎯 В симулация – ползваме фиксирана стойност според ниво
    if (typeof window !== 'undefined' && window.__AXIE_SIMULATION__?.enabled === true) {
        const simulationLevel = parseInt(level);
        const SIMULATION_ASCEND_COSTS = {
            10: 0,
            20: 0.55,
            30: 1.55,
            40: 3.05,
            50: 5.05,
            60: 7.55,
        };
        ascendUSD = SIMULATION_ASCEND_COSTS[simulationLevel] ?? 0;
    } else {
        // 🧠 Извън симулация – оригиналната логика
        ascendUSD = getAscendCostUSD(level);
    }

    if (round) ascendUSD = round2(ascendUSD);

    const sellFeeUSD = computeSellFeeUSD(minValueUSD, sellFeePct ?? DEFAULT_SELL_FEE_PCT, { rounded: round });
    const acquisitionUSD = computeAcquisitionUSD(acquisitionOverride, { rounded: round });

    const total = (ascendUSD || 0) + (sellFeeUSD || 0) + (acquisitionUSD || 0);
    const totalCosts = round ? round2(total) : total;

    return { ascendUSD, sellFeeUSD, acquisitionUSD, totalCosts };
}


export function formatCostsTooltip({ ascendUSD, sellFeeUSD, acquisitionUSD, totalCosts }, currencyFormatter) {
    const fmt = currencyFormatter || ((n) => `$${Number(n).toFixed(2)}`);
    return [
        `Ascend: ${fmt(ascendUSD)}`,
        `Sell fee (4.25%): ${fmt(sellFeeUSD)}`,
        `Acquisition: ${fmt(acquisitionUSD)}`,
        `Total costs: ${fmt(totalCosts)}`
    ].join('\n');
}
