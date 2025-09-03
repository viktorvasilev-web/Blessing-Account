import { getMementoForCard } from './calculateMemento.js';
import { computeCollectionFlatUSD } from './collectionFloors.js'; // 🆕 добавено
import { computeCosts, formatCostsTooltip } from './costs.js'; // 🆕 ВАЖНО: локален път './costs.js'
import { getAcquisitionForRow } from './acquisitionConfig.js'; // 🆕 НОВО: per-class acquisition

export function updateAllMinValues() {
    const cards = document.querySelectorAll('.axie-card');
    if (!cards || cards.length === 0) return;

    // 🆕 1) Централизиран източник на цени с фолбек към стария window.mementoPrices
    const rawPrices =
        (typeof window.getCurrentMementoPrices === 'function')
            ? window.getCurrentMementoPrices()
            : (window.__MEMENTO_PRICES__ || window.mementoPrices || {});

    // ако нямаме цени, излизаме (същото поведение като преди, но по-надеждно)
    if (!rawPrices || Object.keys(rawPrices).length === 0) return;

    const normalizedPrices = normalizePrices(rawPrices); // ↓ прави ключовете lower-case

    const classMap = {
        Aqua: 'aqua', Aquatic: 'aqua', Beast: 'beast', Plant: 'plant',
        Bug: 'bug', Bird: 'bird', Reptile: 'reptile',
        Mech: 'mech', Mecha: 'mech', Dawn: 'dawn', Dusk: 'dusk'
    };

    const fmtUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

    // 🆕 Минимална стойност на карта в USD (изискване)
    const MIN_VALUE_FLOOR_USD = 2.5;

    cards.forEach(card => {
        const row = getDataFromCard(card);
        const mementoData = getMementoForCard(row) || {};
        const classMemento = mementoData.classMemento || {};

        const parts = [];
        for (const [rawCls, rawAmount] of Object.entries(classMemento)) {
            if (!rawCls) continue;
            if (String(rawCls).toLowerCase().trim() === 'total') continue;

            const key = normalizeClassKey(rawCls, classMap);   // -> lower-case (aqua/plant/...)
            const price = normalizedPrices[key];
            const amount = toNumber(rawAmount);

            if (isFiniteNumber(price) && isFiniteNumber(amount) && amount > 0) {
                parts.push({ cls: key, amount, price, subtotal: price * amount });
            }
        }

        // Memento total
        const mementoTotal = parts.reduce((s, p) => s + p.subtotal, 0);

        // 🆕 Flat от колекцията (ако има)
        const collectionFlat = computeCollectionFlatUSD(row.SpecialCollection);

        // 🆕 избираме по-голямото между mementoTotal и collectionFlat
        const finalTotal = (isFiniteNumber(collectionFlat) && collectionFlat > mementoTotal)
            ? collectionFlat
            : mementoTotal;

        // 🆕 ПРИЛАГАМЕ МИНИМУМ $2.50 СЛЕД избора на източник
        const effectiveTotal = Math.max(finalTotal, MIN_VALUE_FLOOR_USD);

        const formatted = fmtUSD.format(effectiveTotal);

        const placeholder = card.querySelector('.min-value-placeholder');
        if (placeholder) {
            const breakdownTitleLines = parts
                .map(p => `${p.cls}: ${p.amount} × $${p.price} = ${fmtUSD.format(p.subtotal)}`);

            if (isFiniteNumber(collectionFlat)) {
                breakdownTitleLines.push(`Flat(collection): ${fmtUSD.format(collectionFlat)}`);
            }

            // 🆕 Ако е приложен подов минимум – добавяме информативен ред в tooltip-а
            if (effectiveTotal > finalTotal) {
                breakdownTitleLines.push(`Applied floor: ${fmtUSD.format(MIN_VALUE_FLOOR_USD)}`);
            }

            const breakdownTitle = breakdownTitleLines.join('\n');

            // 🆕 Pure Profit: само ако НЯМА колекция (коректно третираме "{}" като НЯМА)
            const hasCollection = hasRealCollection(row.SpecialCollection);
            let pureProfitRow = '';

            if (!hasCollection) {
                const acqPerAxie = getAcquisitionOverride(row.ID);      // per-ID override (ако има)
                const acqPerClass = getAcquisitionForRow(row);          // per-class от конфигурацията
                const acqOverride = (isFiniteNumber(acqPerAxie) ? acqPerAxie : acqPerClass); // 🆕 избор

                const costs = computeCosts({
                    id: row.ID,  // 🟢 Ключово за симулация
                    level: row.Level,
                    minValueUSD: effectiveTotal,
                    acquisitionOverride: acqOverride,
                    // sellFeePct: '4.25%',
                    round: true,
                });

                const pureProfit = isFiniteNumber(costs?.totalCosts)
                    ? Number((effectiveTotal - costs.totalCosts).toFixed(2)) // 🆕 спрямо effectiveTotal
                    : null;

                // вложени средства = Ascend + Acquisition (без Sell fee)
                const invested = Number(((costs?.ascendUSD || 0) + (costs?.acquisitionUSD || 0)).toFixed(2));
                const roiPct = invested > 0 && isFiniteNumber(pureProfit)
                    ? Number(((pureProfit / invested) * 100).toFixed(0)) // цели %
                    : null;

                if (isFiniteNumber(pureProfit)) {
                    const costsTooltip = formatCostsTooltip(costs, n => fmtUSD.format(n));
                    const roiStr = (roiPct !== null) ? `${roiPct}%` : '—';

                    const isNeg = pureProfit < 0;

                    pureProfitRow = `
        <div class="pure-profit${isNeg ? ' neg' : ''}" style="white-space:nowrap" title="${escapeHtml(costsTooltip)}">
          Profit: ${fmtUSD.format(pureProfit)} / ${roiStr}
        </div>`;
                }
            }

            // ❗ Без иконки, на един ред, с nowrap
            placeholder.innerHTML = `
        <div class="min-value" style="white-space:nowrap" title="${breakdownTitle}">
        Value: ${formatted}
        </div>
        ${pureProfitRow}
      `;
        }
    });
}

/* -------- helpers -------- */
function getDataFromCard(card) {
    return {
        ID: card.getAttribute('data-id'),
        Class: card.getAttribute('data-class'),
        BreedCount: parseInt(card.getAttribute('data-breed')),
        Level: parseInt(card.getAttribute('data-level')),
        specialCollection: card.getAttribute('data-has-collection') === 'true' ? '{}' : '',
        ShouldAscend: card.getAttribute('data-should-ascend'),
        Memento: card.getAttribute('data-memento') || '',
        // 🆕 важно: суровата колекция (точно както идва от CSV-to)
        SpecialCollection: card.getAttribute('data-special-collection') || ''
    };
}

function normalizeClassKey(cls, classMap) {
    const trimmed = String(cls).trim();
    const mapped = classMap[trimmed];
    return String(mapped || trimmed).toLowerCase().trim();
}

function normalizePrices(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) {
        const key = String(k).toLowerCase().trim();
        const num = toNumber(v);
        if (isFiniteNumber(num)) out[key] = num;
    }
    return out;
}

function toNumber(val) {
    if (typeof val === 'number') return val;
    if (val == null) return NaN;
    let s = String(val).trim().replace(/[^0-9.,-]/g, '');
    if (s.includes('.') && s.includes(',')) { s = s.replace(/,/g, ''); return parseFloat(s); }
    if (s.includes(',') && !s.includes('.')) { s = s.replace(',', '.'); }
    return parseFloat(s);
}

function isFiniteNumber(n) {
    return typeof n === 'number' && Number.isFinite(n);
}

// 🆕 безопасен HTML escape за tooltip-и
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// 🆕 Има ли реална колекция? (празни стойности или "{}"/"[]" = НЯМА)
function hasRealCollection(raw) {
    if (!raw) return false;
    const t = String(raw).trim();
    if (!t || t === '{}' || t === '[]' || t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return false;
    try {
        const parsed = JSON.parse(t.replace(/'/g, '"'));
        if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed)) return parsed.length > 0;
            return Object.keys(parsed).length > 0;
        }
    } catch {
        return true;
    }
    return false;
}

// 🆕 Acquisition override – per Axie ID (четене от localStorage)
function getAcquisitionOverride(axieId) {
    try {
        const raw = localStorage.getItem(`ax_acq_${axieId}`);
        const num = toNumber(raw);
        return (isFiniteNumber(num) && num >= 0) ? num : undefined;
    } catch {
        return undefined;
    }
}

/* 🆕 2) Глобален експорт, за да може симулацията и други модули да викат пайплайна */
if (typeof window !== 'undefined') {
    window.updateAllMinValues = updateAllMinValues;
}
