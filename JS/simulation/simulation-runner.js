// JS/simulation/simulation-runner.js
import { getMementoForCard } from '/JS/calculateAxieValue/calculateMemento.js';

/* ---------------- helpers ---------------- */

function isVisible(el) {
    if (!el) return false;
    if (el.classList.contains('hidden')) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function getEffectiveLevel(baseLevel, sim) {
    return sim?.enabled && sim.levelOverride != null ? sim.levelOverride : baseLevel;
}
function getEffectiveBreed(baseBreed, sim) {
    return sim?.enabled && sim.breedOverride != null ? sim.breedOverride : baseBreed;
}

/** Нормализира към ценови ключове: Aqua вместо Aquatic. */
function normalizePriceKey(k) {
    if (!k) return k;
    return k === 'Aquatic' ? 'Aqua' : k;
}

/** Строи ефективна ценова карта от базовата + симулационните overrides */
function buildEffectivePriceMap(basePrices, sim) {
    const out = { ...(basePrices || {}) };
    if (!sim?.enabled) return out;

    if (sim.priceOverrides && Object.keys(sim.priceOverrides).length) {
        for (const [k, v] of Object.entries(sim.priceOverrides)) {
            out[normalizePriceKey(k)] = v;
        }
    } else if (sim.priceMultiplier && sim.priceMultiplier !== 1) {
        for (const k of Object.keys(out)) out[k] = out[k] * sim.priceMultiplier;
    }
    return out;
}

/* ---------------- dataset overrides (не пипаме HTML структура) ---------------- */

function storeBaseDatasetOnce(card) {
    if (!card.dataset.levelBase) card.dataset.levelBase = card.dataset.level ?? '';
    if (!card.dataset.breedBase) card.dataset.breedBase = card.dataset.breed ?? '';
}

function applyDatasetOverridesToVisible(sim) {
    const cards = Array.from(document.querySelectorAll('#axieContainer .axie-card'));
    for (const card of cards) {
        // винаги пазим базата, но override правим само на видимите
        storeBaseDatasetOnce(card);
        if (!isVisible(card)) continue;

        const baseLevel = parseInt(card.dataset.levelBase || card.dataset.level, 10);
        const baseBreed = parseInt(card.dataset.breedBase || card.dataset.breed, 10);
        if (!Number.isFinite(baseLevel) || !Number.isFinite(baseBreed)) continue;

        const effLevel = getEffectiveLevel(baseLevel, sim);
        const effBreed = getEffectiveBreed(baseBreed, sim);

        // важен момент: сменяме ТЕКУЩИТЕ data-* (източник за твоите формули)
        card.dataset.level = String(effLevel);
        card.dataset.breed = String(effBreed);
        card.dataset.simApplied = '1'; // маркер (за дебъг)
    }
}

function restoreDatasetToBase() {
    const cards = Array.from(document.querySelectorAll('#axieContainer .axie-card'));
    for (const card of cards) {
        if (card.dataset.levelBase != null) card.dataset.level = card.dataset.levelBase;
        if (card.dataset.breedBase != null) card.dataset.breed = card.dataset.breedBase;
        delete card.dataset.simApplied;
    }
}

/* ---------------- price overrides (без да пипаме бутоните) ---------------- */

function snapshotBasePricesIfNeeded() {
    if (!window.__MEMENTO_PRICES_BASE__ && window.__MEMENTO_PRICES__) {
        // пазим „истината“ веднъж (нормализирания map от mementobuttons.js)
        window.__MEMENTO_PRICES_BASE__ = { ...window.__MEMENTO_PRICES__ };
    }
}

function applyPriceOverrides(sim) {
    // взимаме базата (ако има snapshot) или текущите
    const base = window.__MEMENTO_PRICES_BASE__ || window.__MEMENTO_PRICES__ || {};
    const effective = buildEffectivePriceMap(base, sim);
    window.__MEMENTO_PRICES__ = effective; // 👉 твоят пайплайн ще чете това
}

function restoreBasePrices() {
    if (window.__MEMENTO_PRICES_BASE__) {
        window.__MEMENTO_PRICES__ = { ...window.__MEMENTO_PRICES_BASE__ };
    }
}

/* ---------------- VISUAL helpers (само показват данните от data-*) ---------------- */

function setVisualLevel(card, lvl) {
    const lvSpan = card.querySelector('.level-badge-value');
    if (lvSpan) { lvSpan.textContent = String(lvl); return; }
    const badge = card.querySelector('.level-badge');
    if (badge) badge.textContent = String(lvl);
}

function setVisualBreed(card, breed) {
    const box = card.querySelector('.breed-info');
    if (!box) return;
    const img = box.querySelector('img');
    const imgHtml = img ? img.outerHTML : '';
    box.innerHTML = `${imgHtml} ${breed}`;
}

/** извлича {Class: count,...} от резултата на getMementoForCard; игнорира 'total' */
function extractClassMemento(mementoResult) {
    if (!mementoResult) return {};
    const map = mementoResult.classMemento ? mementoResult.classMemento : mementoResult;
    const out = {};
    for (const [k, v] of Object.entries(map)) {
        if (String(k).toLowerCase() === 'total') continue;
        out[k] = v;
    }
    return out;
}

/** Обновява текстовете xN в .memento-breakdown според новите количества */
function updateMementoBreakdown(card) {
    const lvl = parseInt(card.dataset.level, 10);
    const breed = parseInt(card.dataset.breed, 10);
    const cls = card.dataset.class;

    if (!Number.isFinite(lvl) || !Number.isFinite(breed) || !cls) return;

    // 🆕 Включваме Memento и (по желание) SpecialCollection
    const row = {
        ID: card.dataset.id,
        Class: cls,
        BreedCount: breed,
        Level: lvl,
        Memento: card.dataset.memento || '',                               // <— важно за второстепенните
        specialCollection: card.dataset.hasCollection === 'true' ? '{}' : '',
        SpecialCollection: card.getAttribute('data-special-collection') || ''
    };

    // 1) калкулация
    const mementoRes = getMementoForCard(row) || {};
    const mapRaw = mementoRes.classMemento ? mementoRes.classMemento : mementoRes;

    // нормализирани ключове (Aquatic→Aqua) в lower-case
    const classMap = {};
    for (const [k, v] of Object.entries(mapRaw)) {
        const kk = String(k).toLowerCase().trim();
        if (kk === 'total') continue;
        const norm = (k === 'Aquatic' ? 'aqua' : kk);
        classMap[norm] = Number(v) || 0;
    }

    // 2) обновяваме наличните спанове (не добавяме/махаме нови)
    const spans = card.querySelectorAll('.memento-breakdown .memento-class');
    spans.forEach(span => {
        const img = span.querySelector('img');
        const titleRaw = (img?.getAttribute('title') || img?.getAttribute('alt') || '').trim();
        const keyNorm = (titleRaw === 'Aquatic' ? 'aqua' : titleRaw.toLowerCase());
        const val = classMap[keyNorm] ?? 0;

        if (img) {
            const icon = img.cloneNode(true);
            span.innerHTML = '';
            span.appendChild(icon);
            span.appendChild(document.createTextNode(' x' + val));
        } else {
            span.textContent = 'x' + val;
        }
    });
}

function updateVisualsFromDataset(onlyVisible = true) {
    const cards = Array.from(document.querySelectorAll('#axieContainer .axie-card'));
    const simOn = !!(window.__AXIE_SIMULATION__ && window.__AXIE_SIMULATION__.enabled);
    for (const card of cards) {
        if (onlyVisible && !isVisible(card)) continue;

        const lvl = parseInt(card.dataset.level, 10);
        const brd = parseInt(card.dataset.breed, 10);
        if (Number.isFinite(lvl)) setVisualLevel(card, lvl);
        if (Number.isFinite(brd)) setVisualBreed(card, brd);

        // обнови и визуалните Memento количества според ефективните данни
        updateMementoBreakdown(card);

        // визуален маркер
        if (simOn) card.classList.add('simulated'); else card.classList.remove('simulated');
    }
}

/* ---------------- THEME helper ---------------- */
function toggleReptileTheme(isOn) {
    // Ако имаш и глобална dark тема, можеш да я активираш паралелно:
    // document.body.classList.toggle('dark', !!isOn);
    document.body.classList.toggle('theme-reptile', !!isOn);
}

/* ---------------- core ---------------- */

export function applySimulationToVisibleCards() {
    const sim = window.__AXIE_SIMULATION__ || {};
    const recalc = () => {
        if (typeof window.updateAllMinValues === 'function') {
            try { window.updateAllMinValues(); } catch (e) { console.warn('updateAllMinValues error:', e); }
        }
    };

    if (!sim.enabled) {
        // 1) върни dataset към базовите
        restoreDatasetToBase();
        // 2) върни цените към базовите
        restoreBasePrices();
        // 3) пусни оригиналния ти пайплайн (Value/Profit/всичко)
        recalc();
        // 4) визуално отрази базовите Level/Breed + Memento (само видимите)
        updateVisualsFromDataset(true);

        /* 🆕 OFF → изключи темата */
        toggleReptileTheme(false);
        return;
    }

    // симулация ON:
    // 1) базови цени → снимка (само веднъж), после приложи overrides (множител/пер-клас)
    snapshotBasePricesIfNeeded();
    applyPriceOverrides(sim);

    // 2) подай ефективни Level/Breed през data-* само на ВИДИМИТЕ карти
    restoreDatasetToBase();               // (почисти стари overrides, ако има)
    applyDatasetOverridesToVisible(sim);  // (само текущо видимите)

    // 3) пусни оригиналния пайплайн
    recalc();

    // 4) визуално отрази ефективните Level/Breed + Memento (само видимите)
    updateVisualsFromDataset(true);

    /* 🆕 ON → включи темата */
    toggleReptileTheme(true);
}

/* ---------------- listeners ---------------- */

export function attachSimulationListeners() {
    // При промяна от менюто
    document.addEventListener('simulation:change', () => {
        window.requestAnimationFrame(applySimulationToVisibleCards);
    });

    // При филтриране (променя се множеството видими карти)
    document.addEventListener('filters:applied', () => {
        window.requestAnimationFrame(applySimulationToVisibleCards);
    });

    // При обновяване на цени от Sheets — ако симулацията е активна: преизчисли с текущата база
    document.addEventListener('prices:updated', () => {
        if (window.__AXIE_SIMULATION__?.enabled) {
            // обнови snapshot към последната база и преизчисли
            window.__MEMENTO_PRICES_BASE__ = { ...(window.__MEMENTO_PRICES__ || {}) };
            window.requestAnimationFrame(applySimulationToVisibleCards);
        }
    });

    // 🆕 при първоначално зареждане – синхронизирай темата със статуса на симулацията
    const syncTheme = () => toggleReptileTheme(!!(window.__AXIE_SIMULATION__ && window.__AXIE_SIMULATION__.enabled));

    // При първоначално зареждане – ако симулацията е активна
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        syncTheme();
        if (window.__AXIE_SIMULATION__?.enabled) {
            window.requestAnimationFrame(applySimulationToVisibleCards);
        }
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            syncTheme();
            if (window.__AXIE_SIMULATION__?.enabled) {
                window.requestAnimationFrame(applySimulationToVisibleCards);
            }
        });
    }
}
