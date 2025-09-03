// /Users/viktorvasilev/AxieWeb/JS/calculateAxieValue/collectionFloors.js

// Правила:
// Nightmare: 1 -> $30, 2 -> $60, 3+ -> $90 (кап до 3)
// Shiny: >=1 -> $270
// Summer: >=1 -> $25
// ORIGIN: >=1 -> $100
const COLLECTION_RULES = {
    nightmare(count) {
        const c = Math.max(0, Number(count) || 0);
        if (c <= 0) return 0;
        const tier = Math.min(c, 3);
        const table = { 1: 30, 2: 60, 3: 90 };
        return table[tier] || 0;
    },
    shiny(count) { return (Number(count) || 0) > 0 ? 270 : 0; },
    summer(count) { return (Number(count) || 0) > 0 ? 25 : 0; },
    origin(count) { return (Number(count) || 0) > 0 ? 100 : 0; },
};

function normalizeName(name) {
    return String(name || '').toLowerCase().trim();
}

// Приема обект или CSV-to низ: "{'ORIGIN': 1, 'Shiny': 1, 'Nightmare': 3}"
function parseSpecialCollection(input) {
    if (!input) return {};
    if (typeof input === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(input)) out[normalizeName(k)] = Number(v) || 0;
        return out;
    }
    if (typeof input === 'string') {
        let s = input.trim();
        if (s.startsWith('{') && s.includes("'")) s = s.replace(/'/g, '"'); // към валиден JSON
        try { return parseSpecialCollection(JSON.parse(s)); }
        catch { return {}; }
    }
    return {};
}

// 👉 Единствената функция, която ти трябва в другия файл
export function computeCollectionFlatUSD(specialCollection) {
    const spec = parseSpecialCollection(specialCollection);
    let total = 0;
    for (const [name, count] of Object.entries(spec)) {
        const rule = COLLECTION_RULES[normalizeName(name)];
        if (typeof rule === 'function') total += rule(count);
    }
    return total; // число (USD)
}
