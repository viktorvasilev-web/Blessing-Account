// JS/global-menu/metrics-circle.js
import { getMementoForCard } from '/JS/calculateAxieValue/calculateMemento.js';
import { classColors } from '/JS/config.js';
import { computeCollectionFlatUSD } from '/JS/calculateAxieValue/collectionFloors.js'; // 🆕 добавено

/* ========= helpers ========= */
function isVisible(el) {
    if (!el) return false;
    if (el.classList.contains('hidden')) return false;
    const s = window.getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
}
function toNumber(val) {
    if (typeof val === 'number') return val;
    if (val == null) return NaN;
    let s = String(val).trim().replace(/[^0-9.,-]/g, '');
    if (s.includes('.') && s.includes(',')) { s = s.replace(/,/g, ''); return parseFloat(s); }
    if (s.includes(',') && !s.includes('.')) { s = s.replace(',', '.'); }
    return parseFloat(s);
}
function normalizePrices(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) {
        const num = toNumber(v);
        if (Number.isFinite(num)) out[String(k).toLowerCase()] = num;
    }
    return out;
}
function normalizeClassKey(cls) {
    // вход от breakdown: Plant, Beast, Bug, Bird, Reptile, Aquatic/Aqua, Mech/Mecha, Dawn, Dusk
    if (!cls) return '';
    if (cls === 'Aquatic') return 'aqua';
    if (cls === 'Mecha') return 'mech';
    return String(cls).toLowerCase();
}
function normalizePrimaryClass(cls) {
    // за fallback, когато няма breakdown (mementoTotal = 0)
    const map = {
        Aqua: 'aqua', Aquatic: 'aqua', Beast: 'beast', Plant: 'plant', Bug: 'bug',
        Bird: 'bird', Reptile: 'reptile', Mech: 'mech', Mecha: 'mech', Dawn: 'dawn', Dusk: 'dusk'
    };
    return (map[cls] || String(cls || '').toLowerCase());
}
function displayClassName(kLower) {
    const map = {
        aqua: 'Aquatic', beast: 'Beast', plant: 'Plant', bug: 'Bug', bird: 'Bird',
        reptile: 'Reptile', mech: 'Mech', dawn: 'Dawn', dusk: 'Dusk'
    };
    return map[kLower] || (kLower.charAt(0).toUpperCase() + kLower.slice(1));
}
const fmtUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

/* ========= aggregation: per-class USD contributions with collection flat & floor ========= */
const MIN_VALUE_FLOOR_USD = 2.5; // 🆕 под на карта

function aggregateValueByClass() {
    const basePrices = window.__MEMENTO_PRICES__ || window.mementoPrices || {};
    const prices = normalizePrices(basePrices);

    const cards = Array.from(document.querySelectorAll('#axieContainer .axie-card')).filter(isVisible);

    // USD по клас (след всички корекции)
    const usdByClass = Object.create(null);
    let totalValue = 0;

    for (const card of cards) {
        const row = {
            ID: card.getAttribute('data-id'),
            Class: card.getAttribute('data-class'),
            BreedCount: parseInt(card.getAttribute('data-breed')),
            Level: parseInt(card.getAttribute('data-level')),
            Memento: card.getAttribute('data-memento') || '',
            specialCollection: card.getAttribute('data-has-collection') === 'true' ? '{}' : '',
            SpecialCollection: card.getAttribute('data-special-collection') || ''
        };

        // 1) breakdown по клас → USD за тази карта
        const res = getMementoForCard(row) || {};
        const breakdown = res.classMemento || res || {};

        let mementoUsdByClass = Object.create(null);
        let mementoTotalUSD = 0;

        for (const [cls, cntRaw] of Object.entries(breakdown)) {
            const key = normalizeClassKey(cls);
            if (key === 'total') continue;
            const cnt = toNumber(cntRaw) || 0;
            const p = prices[key] || 0;
            const usd = cnt * p;
            if (usd > 0) {
                mementoUsdByClass[key] = (mementoUsdByClass[key] || 0) + usd;
                mementoTotalUSD += usd;
            }
        }

        // 2) Flat от колекцията
        const collectionFlat = computeCollectionFlatUSD(row.SpecialCollection);

        // 3) Избор по-голямото (както в updateAllMinValues)
        const chosen = (Number.isFinite(collectionFlat) && collectionFlat > mementoTotalUSD)
            ? collectionFlat
            : mementoTotalUSD;

        // 4) Прилагаме под $2.50/карта
        const effectiveCardUSD = Math.max(chosen, MIN_VALUE_FLOOR_USD);

        // 5) Разпределяне на ефективната стойност по класове
        if (mementoTotalUSD > 0) {
            // имаме breakdown → скалираме пропорционално
            const scale = effectiveCardUSD / mementoTotalUSD;
            for (const [k, usd] of Object.entries(mementoUsdByClass)) {
                usdByClass[k] = (usdByClass[k] || 0) + usd * scale;
            }
        } else {
            // няма breakdown (всичко 0), но имаме flat или само floor
            const fallbackKey = normalizePrimaryClass(row.Class) || 'reptile';
            usdByClass[fallbackKey] = (usdByClass[fallbackKey] || 0) + effectiveCardUSD;
        }

        totalValue += effectiveCardUSD;
    }

    return { totalValue, usdByClass, visibleCount: cards.length };
}

/* ========= ring painting ========= */
const CLASS_ORDER = ['plant', 'beast', 'bug', 'bird', 'reptile', 'aqua', 'mech', 'dawn', 'dusk']; // стабилен ред

function buildConicGradientStops(usdByClass, totalValue) {
    if (totalValue <= 0) return 'conic-gradient(#444 0deg 360deg)';

    let acc = 0;
    const parts = [];

    for (const key of CLASS_ORDER) {
        const usd = usdByClass[key] || 0;
        if (usd <= 0) continue;

        const pct = usd / totalValue;               // 0..1
        const degStart = acc * 360;
        const degEnd = (acc + pct) * 360;
        acc += pct;

        const name = displayClassName(key);         // напр. 'Reptile'
        const col = (classColors && classColors[name]) || '#7a3bd4';
        parts.push(`${col} ${degStart}deg ${degEnd}deg`);
    }

    if (acc < 1) {
        parts.push(`#444 ${acc * 360}deg 360deg`);
    }

    return `conic-gradient(${parts.join(', ')})`;
}

/* ========= DOM ========= */
export function initMetricsCircle() {
    const host = document.getElementById('metricsCircle');
    if (!host) return;

    host.innerHTML = `
    <div class="lux-metrics-circle" aria-live="polite">
      <div class="lux-ring"></div>
      <div class="lux-inner">
        <div class="lux-amount" id="luxVal">$0.00</div>
        <div class="lux-label">Value</div>
      </div>
    </div>
  `;

    // първи рендер
    updateMetricsCircle();

    // live обновяване
    const schedule = () => window.requestAnimationFrame(updateMetricsCircle);
    document.addEventListener('filters:applied', schedule);
    document.addEventListener('simulation:change', schedule);
    document.addEventListener('prices:updated', schedule);

    const cont = document.getElementById('axieContainer');
    if (cont && 'MutationObserver' in window) {
        const mo = new MutationObserver(() => schedule());
        mo.observe(cont, { childList: true, subtree: true, attributes: true });
    }
}

export function updateMetricsCircle() {
    const host = document.getElementById('metricsCircle');
    if (!host) return;

    const { totalValue, usdByClass } = aggregateValueByClass();

    const elV = host.querySelector('#luxVal');
    const ring = host.querySelector('.lux-ring');

    if (elV) elV.textContent = fmtUSD.format(totalValue);

    if (ring) {
        const bg = buildConicGradientStops(usdByClass, totalValue);
        ring.style.background = bg;
        ring.style.setProperty('--ring-thickness', '22%'); // фиксирана дебелина
    }
}
