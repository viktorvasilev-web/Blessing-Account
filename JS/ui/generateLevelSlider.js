import { updateAxieCount } from '/JS/global-menu/menu.js';

// Level slider: UI като Purity, +10px дължина, без долния дубликат,
// директно филтрира картите и обновява брояча.
export function generateLevelSlider() {
    const MAX_LEVEL = 60;

    const container = document.getElementById('levelSliderContainer');
    if (!container) return;

    // Премахни/скрий стария долен label, за да няма дублиране
    const oldValueEl = document.getElementById('levelSliderValue');
    if (oldValueEl) oldValueEl.remove(); // или oldValueEl.style.display = 'none';

    // Нулирай контейнера
    container.innerHTML = '';

    // Горен ред: "Level 1"
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.alignItems = 'center';
    topRow.style.gap = '8px';
    topRow.style.marginBottom = '4px';

    const label = document.createElement('div');
    label.textContent = 'Level';
    label.style.fontWeight = 'bold';
    label.style.background = '#2c2c2c';
    label.style.color = '#ffffff';
    label.style.padding = '2px 6px';
    label.style.display = 'inline-block';
    label.style.borderRadius = '6px';

    const valueLabel = document.createElement('div');
    valueLabel.textContent = '1';
    valueLabel.style.fontWeight = 'bold';
    valueLabel.style.background = '#2c2c2c';
    valueLabel.style.color = '#ffffff';
    valueLabel.style.display = 'inline-block';
    valueLabel.style.padding = '2px 6px';
    valueLabel.style.borderRadius = '6px';

    topRow.appendChild(label);
    topRow.appendChild(valueLabel);

    // Нативен range (по-дълъг с +10px, центриран)
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '1';
    input.max = String(MAX_LEVEL);
    input.step = '1';
    input.value = '1';
    input.id = 'levelRangeNative';
    input.style.width = 'calc(100% + 10px)';
    input.style.marginLeft = '-5px';
    input.style.marginRight = '-5px';

    // Държим избраното точно ниво | null
    let levelExact = null;

    // Помощни
    const setLabel = n => { valueLabel.textContent = String(n); };

    const countVisibleAndUpdate = () => {
        let visible = 0;
        document.querySelectorAll('.axie-card').forEach(c => {
            if (getComputedStyle(c).display !== 'none') visible++;
        });
        try { updateAxieCount(visible); } catch { }
    };

    const showAll = () => {
        document.querySelectorAll('.axie-card').forEach(c => { c.style.display = ''; });
        countVisibleAndUpdate();
    };

    const applyLevelFilter = n => {
        document.querySelectorAll('.axie-card').forEach(card => {
            const lv = parseInt(card.getAttribute('data-level'), 10) || 0;
            card.style.display = (lv === n) ? '' : 'none';
        });
        countVisibleAndUpdate();
    };

    const applyNow = () => {
        if (levelExact == null) showAll();
        else applyLevelFilter(levelExact);
    };

    // Слушатели
    input.addEventListener('input', () => {
        const val = parseInt(input.value, 10) || 1;
        setLabel(val); // само UI по време на влачене
    });

    input.addEventListener('change', () => {
        const val = parseInt(input.value, 10) || 1;
        levelExact = val;
        setLabel(val);
        applyNow();
    });

    // Reset с двоен клик върху стойността
    valueLabel.addEventListener('dblclick', () => {
        levelExact = null;
        applyNow();
    });

    // Клик по диапазонните бутони → изключи точния level (бутоните ще си филтрират)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.level-btn');
        if (!btn) return;
        levelExact = null;
    });

    // Авто-реаплай при DOM промени (ако levelExact е активен)
    if (window.__levelDomObserver) {
        try { window.__levelDomObserver.disconnect(); } catch { }
    }
    window.__levelDomObserver = new MutationObserver(() => {
        if (levelExact != null) {
            clearTimeout(window.__levelDomTimer);
            window.__levelDomTimer = setTimeout(applyNow, 0);
        }
    });
    window.__levelDomObserver.observe(document.body, { childList: true, subtree: true, attributes: true });

    // Сглобяване
    container.appendChild(topRow);
    container.appendChild(input);

    // Стартов UI
    setLabel(1);
}
