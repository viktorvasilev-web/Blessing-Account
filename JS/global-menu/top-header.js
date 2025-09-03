// JS/global-menu/top-header.js
// Оркестратор: инжектира стилове, строи стабилно HTML скеле в #topHeader и рендва 4 колони.
// index.html НЕ се пипа – само извикай renderTopHeader() (както вече правиш).

import { renderCol1 } from './top-header/col1.js';
import { renderCol2 } from './top-header/col2.js';
import { renderCol3 } from './top-header/col3.js';
import { renderCol4 } from './top-header/col4.js';

/* ---------- Настройки ---------- */
// 'split'  = колони 2 и 3 са два вътрешни слота в общ контейнер
// 'merged' = центърът (2+3) се държи като ЕДИН блок
const CENTER_MODE = 'merged'; // ← обединени 2 и 3

/* ---------- Helpers ---------- */
function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
        if (k === 'class') node.className = v;
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (v !== undefined && v !== null) node.setAttribute(k, v);
    }
    for (const c of children) {
        if (c == null) continue;
        if (c instanceof Node) node.appendChild(c);
        else node.appendChild(document.createTextNode(String(c)));
    }
    return node;
}

function injectStyles() {
    if (document.getElementById('topHeaderStyles')) return;
    const css = `
  /* —— Top Header (4 равни колони; 2 и 3 са обединени в общ контейнер) —— */
  .top-header {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #1f1f1f;
    border-bottom: 1px solid #2c2c2c;
    padding: 10px 14px;

    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    align-items: center;
  }

  .th-col1 { grid-column: 1 / 2; display: flex; align-items: center; gap: 10px; }
  .th-col2-3 {
    grid-column: 2 / 4;
    display: grid;
    grid-template-columns: 1fr 1fr; /* вътрешни слотове 2 и 3 (ще стане 1fr при merged) */
    gap: 12px;
    align-items: center;
  }
  .th-col2 { display: flex; justify-content: flex-end; align-items: center; }
  .th-col3 { display: flex; justify-content: flex-start; align-items: center; }
  .th-col4 { grid-column: 4 / 5; display: flex; justify-content: flex-end; gap: 8px; align-items: center; }

  /* Базови компоненти (ползвани от колони) */
  .site-badge {
    padding: 4px 8px;
    border-radius: 999px;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    font-size: 12px;
    color: #ddd;
  }
  .site-title {
    margin: 0;
    font-size: 18px;
    color: #eee;
    letter-spacing: 0.2px;
  }
  .wallet-badge {
    padding: 6px 10px;
    border-radius: 8px;
    background: #242424;
    border: 1px solid #3a3a3a;
    font-size: 13px;
    color: #eaeaea;
    white-space: nowrap;
  }
  .btn {
    padding: 6px 10px;
    border-radius: 8px;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    color: #eee;
    cursor: pointer;
  }
  .btn:hover { background: #333; }

  /* responsive */
  @media (max-width: 900px) {
    .top-header { grid-template-columns: 1fr 1fr; }
    .th-col1 { grid-column: 1 / 2; }
    .th-col2-3 {
      grid-column: 1 / -1;
      grid-template-columns: 1fr; /* един блок при merged */
    }
    .th-col2, .th-col3 { justify-content: center; }
    .th-col4 { grid-column: 2 / 3; justify-content: end; }
  }`;
    const style = el('style', { id: 'topHeaderStyles' }, css);
    document.head.appendChild(style);
}

function buildSkeleton() {
    const mount = document.getElementById('topHeader');
    if (!mount) return null;

    // предотвратяване на двойно рендериране
    if (mount.firstChild?.classList?.contains('top-header')) return mount.firstChild;

    const header = el('header', { class: 'top-header', role: 'banner', 'aria-label': 'Primary header' },
        el('div', { class: 'th-col1', id: 'th-col1' }),
        el('div', { class: 'th-col2-3', 'aria-label': 'Center group' },
            el('div', { class: 'th-col2', id: 'th-col2' }),
            el('div', { class: 'th-col3', id: 'th-col3' }),
        ),
        el('div', { class: 'th-col4', id: 'th-col4' })
    );

    mount.innerHTML = '';
    mount.appendChild(header);
    return header;
}

function applyCenterMode(mode = 'split') {
    const parent = document.querySelector('.th-col2-3');
    const col2 = document.getElementById('th-col2');
    const col3 = document.getElementById('th-col3');
    if (!parent || !col2 || !col3) return;

    if (mode === 'merged') {
        parent.style.gridTemplateColumns = '1fr';
        col2.style.gridColumn = '1 / -1'; // центърът е един – ползваме col2
        col3.style.display = 'none';      // скриваме col3
    } else {
        parent.style.gridTemplateColumns = '1fr 1fr';
        col2.style.gridColumn = '';
        col3.style.display = '';
    }
}

/* ---------- Публичен API за добавки ---------- */
export const TopHeaderAPI = {
    set(slotId, nodeOrHTML) {
        const slot = document.getElementById(slotId);
        if (!slot) return null;
        slot.innerHTML = '';
        if (nodeOrHTML instanceof Node) slot.appendChild(nodeOrHTML);
        else slot.innerHTML = String(nodeOrHTML);
        return slot;
    },
    append(slotId, nodeOrHTML) {
        const slot = document.getElementById(slotId);
        if (!slot) return null;
        if (nodeOrHTML instanceof Node) slot.appendChild(nodeOrHTML);
        else slot.insertAdjacentHTML('beforeend', String(nodeOrHTML));
        return slot;
    },
    setCenterMode(mode) {
        applyCenterMode(mode === 'merged' ? 'merged' : 'split');
    }
};

/* ---------- Главен вход ---------- */
export function renderTopHeader() {
    injectStyles();
    const header = buildSkeleton();
    if (!header) return;

    // Рендър по колони (отделни модули)
    const c1 = document.getElementById('th-col1');
    const c2 = document.getElementById('th-col2');
    const c3 = document.getElementById('th-col3');
    const c4 = document.getElementById('th-col4');

    renderCol1(c1);
    renderCol2(c2);
    renderCol3(c3); // ще е скрит при 'merged', но може да го оставиш за бъдеще
    renderCol4(c4);

    // Прилагаме режим на центъра (тук: merged)
    applyCenterMode(CENTER_MODE);
}
