// /Users/viktorvasilev/AxieWeb/JS/global-menu/mementobuttons.js
import { updateAllMinValues } from '../calculateAxieValue/updateMinValues.js';
import { classColors } from '../config.js';

/* ---------- помощни за контрастен текст върху цветен фон ---------- */
function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}
function luminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const toLin = v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const R = toLin(rgb.r), G = toLin(rgb.g), B = toLin(rgb.b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function idealTextColor(bgHex) {
    const L = luminance(bgHex);
    return L < 0.45 ? '#ffffff' : '#111111';
}
function paintButton(el, classKey) {
    const color = classColors?.[classKey];
    if (!color) return;
    const text = idealTextColor(color);
    el.style.background = color;
    el.style.color = text;
    el.style.border = '1px solid rgba(255,255,255,0.18)';
    el.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.06)';
    el.style.textDecoration = 'none';
    el.style.display = 'inline-block';
    el.style.textAlign = 'center';          // ⬅️ центриране на текста
}

/* ---------- линкове към marketplace materials ---------- */
const MEMENTO_LINKS = {
    Plant: 'https://app.axieinfinity.com/marketplace/materials/plant-memento/',
    Beast: 'https://app.axieinfinity.com/marketplace/materials/beast-memento/',
    Bug: 'https://app.axieinfinity.com/marketplace/materials/bug-memento/',
    Bird: 'https://app.axieinfinity.com/marketplace/materials/bird-memento/',
    Reptile: 'https://app.axieinfinity.com/marketplace/materials/reptile-memento/',
    Aquatic: 'https://app.axieinfinity.com/marketplace/materials/aquatic-memento/',
    Mech: 'https://app.axieinfinity.com/marketplace/materials/mech-memento/',
    Dawn: 'https://app.axieinfinity.com/marketplace/materials/dawn-memento/',
    Dusk: 'https://app.axieinfinity.com/marketplace/materials/dusk-memento/',
};

/* ---------- Google Sheets fetch ---------- */
async function fetchPricesFromSheet() {
    const sheetId = '1rC9F-L9c29Xc5kXJ3PvWzrFGeBmQ-OQ9UtL94k3iwlo';
    const apiKey = 'AIzaSyA9EcSz1spy5uCvy8t2yd-CTJkinKXAjqc';

    const endpointC = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Precios!C12:C14?key=${apiKey}`;
    const endpointG = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Precios!G14:G22?key=${apiKey}`;

    try {
        const [resC, resG] = await Promise.all([fetch(endpointC), fetch(endpointG)]);
        const [dataC, dataG] = await Promise.all([resC.json(), resG.json()]);

        if (dataC.values && dataG.values) {
            return {
                axs: parseFloat(dataC.values[0][0]),
                slp: parseFloat(dataC.values[1][0]),
                eth: parseFloat(dataC.values[2][0]),
                plant: parseFloat(dataG.values[0][0]),
                beast: parseFloat(dataG.values[1][0]),
                bug: parseFloat(dataG.values[2][0]),
                bird: parseFloat(dataG.values[3][0]),
                reptile: parseFloat(dataG.values[4][0]),
                aqua: parseFloat(dataG.values[5][0]),
                mech: parseFloat(dataG.values[6][0]),
                dawn: parseFloat(dataG.values[7][0]),
                dusk: parseFloat(dataG.values[8][0]),
            };
        }
        console.log('No data found');
        return {};
    } catch (error) {
        console.error('Error fetching data from Google Sheets:', error);
        return {};
    }
}

/* ---------- 🆕 Нормализиране + глобален getter за цените ---------- */
/** Преобразува долните ключове (plant/beast/...) към стандарта за калкулаторите/симулацията:
 *  Plant, Beast, Bug, Bird, Reptile, Aqua, Mech, Dawn, Dusk
 */
function buildNormalizedPriceMap(prices) {
    if (!prices) return {};
    return {
        Plant: Number(prices.plant ?? 0),
        Beast: Number(prices.beast ?? 0),
        Bug: Number(prices.bug ?? 0),
        Bird: Number(prices.bird ?? 0),
        Reptile: Number(prices.reptile ?? 0),
        Aqua: Number(prices.aqua ?? 0),      // важно: Aqua (не Aquatic) за съвпадение с калкулаторите
        Mech: Number(prices.mech ?? 0),
        Dawn: Number(prices.dawn ?? 0),
        Dusk: Number(prices.dusk ?? 0),
    };
}

/* ---------- Рендер на бутоните ---------- */
function setupMementoButtons() {
    const container = document.getElementById('viewSwitcher2');
    if (!container) return;

    // Класови бутони като <a> (линкове)
    const buttons = [
        { id: 'plantBtn', label: 'Plant', classKey: 'Plant' },
        { id: 'beastBtn', label: 'Beast', classKey: 'Beast' },
        { id: 'bugBtn', label: 'Bug', classKey: 'Bug' },
        { id: 'birdBtn', label: 'Bird', classKey: 'Bird' },
        { id: 'reptileBtn', label: 'Reptile', classKey: 'Reptile' },
        { id: 'aquaBtn', label: 'Aqua', classKey: 'Aquatic' }, // Aqua → Aquatic за линка
        { id: 'mechBtn', label: 'Mech', classKey: 'Mech' },
        { id: 'downBtn', label: 'Dawn', classKey: 'Dawn' },    // запазваме id "downBtn"
        { id: 'duskBtn', label: 'Dusk', classKey: 'Dusk' },
    ];

    buttons.forEach(item => {
        const a = document.createElement('a');
        a.classList.add('filter-button');
        a.id = item.id;
        a.href = MEMENTO_LINKS[item.classKey] || '#';
        a.target = '_blank';
        a.rel = 'noopener';
        a.innerHTML = `${item.label}<br><span class="price">—</span>`;
        paintButton(a, item.classKey);
        container.appendChild(a);
    });

    // Малки токен бутони (нямат линкове)
    const smallButtonsContainer = document.createElement('div');
    smallButtonsContainer.classList.add('small-buttons');

    [
        { id: 'axsBtn', label: 'AXS' },
        { id: 'slpBtn', label: 'SLP' },
        { id: 'ethBtn', label: 'ETH' }
    ].forEach(item => {
        const btn = document.createElement('button');
        btn.classList.add('small-filter-button', 'hidden-button');
        btn.id = item.id;
        btn.innerHTML = `${item.label}<br><span class="price">—</span>`;
        btn.style.textAlign = 'center';     // ⬅️ центриране и при малките, ако ги покажеш
        smallButtonsContainer.appendChild(btn);
    });

    container.appendChild(smallButtonsContainer);

    // Първоначално зареждане на цени
    updateButtonPrices();
}

/* ---------- Обновяване на цените върху бутоните ---------- */
async function updateButtonPrices() {
    const prices = await fetchPricesFromSheet();

    // ✅ Оставяме стария ти глобален обект за съвместимост (ако го ползва нещо друго)
    window.mementoPrices = prices;

    // 🆕 Нормализиран map за всички модули (симулация, калкулатори и др.)
    const normalized = buildNormalizedPriceMap(prices);
    window.__MEMENTO_PRICES__ = normalized;

    // 🆕 Унифициран getter – единен източник на истина за текущите цени
    window.getCurrentMementoPrices = function () {
        return window.__MEMENTO_PRICES__ || {};
    };

    // 🆕 Сигнализирай другите модули, че цените са обновени
    document.dispatchEvent(new CustomEvent('prices:updated', { detail: { prices: normalized } }));

    // Обнови MinValue по картите със съществуващата ти функция
    updateAllMinValues();

    // Токени
    const axsButton = document.getElementById('axsBtn');
    const slpButton = document.getElementById('slpBtn');
    const ethButton = document.getElementById('ethBtn');

    if (axsButton) axsButton.innerHTML = `AXS <br> $${prices.axs?.toFixed(2) ?? '0.00'}`;
    if (slpButton) slpButton.innerHTML = `SLP <br> $${prices.slp?.toFixed(5) ?? '0.00000'}`;
    if (ethButton) ethButton.innerHTML = `ETH <br> $${prices.eth?.toFixed(2) ?? '0.00'}`;

    // Класове
    const mementoButtons = [
        { id: 'plantBtn', label: 'Plant', price: prices.plant },
        { id: 'beastBtn', label: 'Beast', price: prices.beast },
        { id: 'bugBtn', label: 'Bug', price: prices.bug },
        { id: 'birdBtn', label: 'Bird', price: prices.bird },
        { id: 'reptileBtn', label: 'Reptile', price: prices.reptile },
        { id: 'aquaBtn', label: 'Aqua', price: prices.aqua },
        { id: 'mechBtn', label: 'Mech', price: prices.mech },
        { id: 'downBtn', label: 'Dawn', price: prices.dawn }, // id "downBtn", текст "Dawn"
        { id: 'duskBtn', label: 'Dusk', price: prices.dusk }
    ];

    mementoButtons.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            el.innerHTML = `${item.label} <br> $${(item.price ?? 0).toFixed(4)}`;
        }
    });
}

/* ---------- Старт ---------- */
document.addEventListener('DOMContentLoaded', setupMementoButtons);
