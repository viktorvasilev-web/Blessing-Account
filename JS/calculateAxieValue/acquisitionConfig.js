// /Users/viktorvasilev/AxieWeb/JS/calculateAxieValue/acquisitionConfig.js

const STORAGE_KEY = 'ax_acq_class_map_v1';

export const DEFAULT_ACQ_MAP = {
    aqua: 5,
    beast: 5,
    plant: 5,
    bug: 5,
    bird: 5,
    reptile: 5,
    mech: 5,
    dawn: 5,
    dusk: 5,
};

function toNumber(val) {
    if (typeof val === 'number') return val;
    if (val == null) return NaN;
    let s = String(val).trim().replace(/[^0-9.,-]/g, '');
    if (s.includes('.') && s.includes(',')) { s = s.replace(/,/g, ''); return parseFloat(s); }
    if (s.includes(',') && !s.includes('.')) { s = s.replace(',', '.'); }
    return parseFloat(s);
}
function isFiniteNumber(n) { return typeof n === 'number' && Number.isFinite(n); }

export function normalizeClassKey(cls) {
    const m = {
        Aqua: 'aqua', Aquatic: 'aqua',
        Beast: 'beast',
        Plant: 'plant',
        Bug: 'bug',
        Bird: 'bird',
        Reptile: 'reptile',
        Mech: 'mech', Mecha: 'mech',
        Dawn: 'dawn',
        Dusk: 'dusk',
    };
    const raw = (cls ?? '').toString().trim();
    return (m[raw] || raw).toLowerCase().trim();
}

function sanitizeMap(map) {
    const out = { ...DEFAULT_ACQ_MAP };
    if (!map || typeof map !== 'object') return out;
    for (const [k, v] of Object.entries(map)) {
        const key = normalizeClassKey(k);
        const num = toNumber(v);
        if (key in out && isFiniteNumber(num) && num >= 0) out[key] = num;
    }
    return out;
}

export function loadAcquisitionMap() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_ACQ_MAP };
        const obj = JSON.parse(raw);
        return sanitizeMap(obj);
    } catch {
        return { ...DEFAULT_ACQ_MAP };
    }
}

export function saveAcquisitionMap(map) {
    const clean = sanitizeMap(map);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clean)); } catch { }
    return clean;
}

export function getAcquisitionForClass(cls) {
    const key = normalizeClassKey(cls);
    const map = loadAcquisitionMap();
    return map[key] ?? DEFAULT_ACQ_MAP[key] ?? 5;
}

export function getAcquisitionForRow(row) {
    return getAcquisitionForClass(row?.Class);
}

/* =========================
   CENTERED MODAL POPOVER UI
   ========================= */
export function attachAcqPopover(targetSelector = '#acqControls') {
    const host = document.querySelector(targetSelector);
    if (!host) return;

    // Бутонът си остава в менюто (не променя лейаута)
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'acq-btn';
    btn.title = 'Set Costs by class'; // 🆕 tooltip
    btn.textContent = 'Costs';        // 🆕 текст
    host.appendChild(btn);

    // Създаваме overlay + модално съдържание и ги монтираме към <body>,
    // за да не влияят на лейаута на менюто/страницата.
    const overlay = document.createElement('div');
    overlay.className = 'acq-overlay';
    overlay.style.display = 'none';

    const modal = document.createElement('div');
    modal.className = 'acq-modal';
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    function renderForm() {
        const map = loadAcquisitionMap();
        const classes = Object.keys(DEFAULT_ACQ_MAP);

        modal.innerHTML = `
      <div class="acq-modal-head">
        <span>Breeding/Buy Costs By class</span>
        <button type="button" class="acq-close" aria-label="Close">×</button>
      </div>
      <div class="acq-modal-body">
        ${classes.map(key => `
          <label class="acq-row">
            <span class="acq-name">${key}</span>
            <input class="acq-input" data-key="${key}" type="number" min="0" step="0.01" value="${map[key]}">
          </label>
        `).join('')}
        <div class="acq-hint">Press <b>Enter</b> to save & close. <span class="sep">·</span> <b>Esc</b> or click outside to close.</div>
      </div>
      <div class="acq-modal-foot">
        <button type="button" class="acq-reset">Reset</button>
        <button type="button" class="acq-save">Save</button>
      </div>
    `;

        modal.querySelector('.acq-close')?.addEventListener('click', close);
        modal.querySelector('.acq-save')?.addEventListener('click', saveAndClose);
        modal.querySelector('.acq-reset')?.addEventListener('click', () => {
            saveAcquisitionMap(DEFAULT_ACQ_MAP);
            try { window.updateAllMinValues && window.updateAllMinValues(); } catch { }
            close();
        });

        modal.querySelectorAll('.acq-input').forEach(inp => {
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); saveAndClose(); }
                else if (e.key === 'Escape') { e.preventDefault(); close(); }
            });
            inp.addEventListener('blur', () => {
                const num = toNumber(inp.value);
                if (!isFiniteNumber(num) || num < 0) {
                    const k = inp.getAttribute('data-key');
                    const map2 = loadAcquisitionMap();
                    inp.value = map2[k];
                }
            });
        });
    }

    function open() {
        renderForm();
        overlay.style.display = 'flex';         // центрирано (виж CSS)
        document.addEventListener('keydown', handleEsc, { capture: true });
    }
    function close() {
        overlay.style.display = 'none';
        document.removeEventListener('keydown', handleEsc, { capture: true });
    }
    function handleEsc(e) { if (e.key === 'Escape') close(); }

    function saveAndClose() {
        const inputs = modal.querySelectorAll('.acq-input');
        const curr = loadAcquisitionMap();
        inputs.forEach(inp => {
            const k = inp.getAttribute('data-key');
            const num = toNumber(inp.value);
            if (isFiniteNumber(num) && num >= 0) curr[k] = num;
        });
        saveAcquisitionMap(curr);
        try { window.updateAllMinValues && window.updateAllMinValues(); } catch { }
        close();
    }

    // Клик извън модала затваря (клик в модала – НЕ)
    overlay.addEventListener('mousedown', (e) => {
        if (!modal.contains(e.target)) close();
    });

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (overlay.style.display === 'none') open(); else close();
    });
}
