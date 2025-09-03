// /Users/viktorvasilev/AxieWeb/JS/ui/filterGene.js
import { applyFilters } from '../filter-utils.js';

/* ====== настройки ====== */
const DEBUG = false;          // смени на true, за да виждаш лога
const DEFAULT_PLACEHOLDER = 'Търси по име на част...';
const DEFAULT_DEBOUNCE_MS = 200;

/* ====== помощни ====== */
function log(...args) { if (DEBUG) console.log('[filterGene]', ...args); }
function debounce(fn, wait = DEFAULT_DEBOUNCE_MS) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
}

/**
 * Инициализира и „облича“ #filterGene със стилен контейнер и clear бутон.
 * Ако липсва, може да го създаде в даден контейнер.
 * @param {Object} opts
 * @param {string} [opts.containerSelector] - къде да създаде input-а, ако липсва
 * @param {string} [opts.placeholder]
 * @param {number} [opts.debounceMs]
 */
export function setupGeneSearch(opts = {}) {
    const {
        containerSelector,
        placeholder = DEFAULT_PLACEHOLDER,
        debounceMs = DEFAULT_DEBOUNCE_MS,
    } = opts;

    let input = document.getElementById('filterGene');

    // ако няма input и имаме контейнер → създай
    if (!input && containerSelector) {
        const host = document.querySelector(containerSelector);
        if (host) {
            input = document.createElement('input');
            input.id = 'filterGene';
            input.type = 'search';
            input.placeholder = placeholder;
            host.appendChild(input);
            log('created #filterGene in', containerSelector);
        }
    }

    if (!input) { log('no #filterGene found, skip'); return; }

    // предотвратяване на двойно „обличане“
    if (input.dataset.enhanced === '1') { log('already enhanced'); return; }

    // подсигуряваме type и placeholder
    input.setAttribute('type', 'search');
    if (!input.placeholder) input.placeholder = placeholder;

    // ако няма wrapper .gene-search → създай
    let wrapper = input.parentElement;
    if (!wrapper || !wrapper.classList.contains('gene-search')) {
        wrapper = document.createElement('div');
        wrapper.className = 'gene-search';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        log('wrapped #filterGene with .gene-search');
    }

    // добавяме clear бутон (универсален за всички браузъри)
    let clearBtn = wrapper.querySelector('.clear-btn');
    if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'clear-btn';
        clearBtn.setAttribute('aria-label', 'Clear');
        clearBtn.textContent = '×';
        wrapper.appendChild(clearBtn);
    }

    const refreshClear = () => { clearBtn.style.display = input.value ? 'inline-flex' : 'none'; };
    refreshClear();

    const debApply = debounce(() => {
        try { applyFilters(); } catch (e) { console.warn('applyFilters error:', e); }
    }, debounceMs);

    input.addEventListener('input', () => { refreshClear(); debApply(); });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); applyFilters(); }
        if (e.key === 'Escape') { e.preventDefault(); input.value = ''; refreshClear(); applyFilters(); }
    });
    clearBtn.addEventListener('click', () => {
        input.value = ''; input.focus(); refreshClear(); applyFilters();
    });

    // маркираме като „обработен“
    input.dataset.enhanced = '1';
    log('enhanced #filterGene');
}

/* ====== Авто-инициализация ======
   Опитваме сами, дори ако UI-то се рендва след време. */
function autoInitOnce() {
    // опитай най-честите контейнери за филтри; ползва се първият намерен
    const candidates = [
        '#levelInputContainer',
        '#puritySliderContainer',
        '#filtersPanel',
        '#sidebar'
    ];
    const found = candidates.find(sel => document.querySelector(sel));
    // не създаваме input автоматично; само „обличаме“, ако вече го има.
    setupGeneSearch({ containerSelector: undefined });

    // Ако #filterGene още липсва, наблюдаваме DOM докато се появи
    if (!document.getElementById('filterGene')) {
        const observer = new MutationObserver(() => {
            const el = document.getElementById('filterGene');
            if (el) {
                setupGeneSearch({}); // облечи
                observer.disconnect();
                log('auto-enhanced after DOM change');
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        // Ако искаш да го създадем в found контейнер, смени горния setupGeneSearch с:
        // setupGeneSearch({ containerSelector: found });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitOnce, { once: true });
} else {
    autoInitOnce();
}

/* Достъп и от конзолата/други модули */
window.setupGeneSearch = setupGeneSearch;
