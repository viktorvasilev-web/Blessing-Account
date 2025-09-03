// JS/global-menu/top-header/col1.js
export function renderCol1(mount) {
    if (!mount) return;
    ensureCol1StylesSimple();

    // Данни (редактирай тук при нужда)
    const complete100 = [
        'viktorsfsl1039@abv.bg-3plots',
        'viktorsfsl1038@abv.bg-3plots',
        'viktorsfsl1043@abv.bg-4plots',
        'viktorsfsl1037@abv.bg-1plot',
        'viktorsfsl1042@abv.bg-4plots',
    ];
    const axpAccounts = ['viktorsfsl1042@abv.bg-4plots'];
    const tournamentAccounts = ['viktorsfsl1042@abv.bg-2plots'];

    // Семпла структура
    mount.innerHTML = `
      <div class="c1" role="region" aria-label="Blessing Accounts">
        <h2 class="c1__title">Blessing Accounts:</h2>
  
        ${renderSection('Complete to 100%', complete100)}
        ${renderSection('AXP accounts', axpAccounts)}
        ${renderSection('Tournament accounts', tournamentAccounts)}
      </div>
    `;
}

function renderSection(label, items) {
    return `
      <section class="c1__group">
        <div class="c1__head">
          <span class="c1__label">${label}</span>
          <span class="c1__count">${items.length}</span>
        </div>
        <ul class="c1__list">
          ${items.length
            ? items.map(e => `
                  <li class="c1__item" title="${e}">
                    <span class="c1__dot"></span>
                    <span class="c1__email">${e}</span>
                  </li>`).join('')
            : `<li class="c1__item c1__item--empty"><span class="c1__email">—</span></li>`
        }
        </ul>
      </section>
    `;
}

function ensureCol1StylesSimple() {
    // махаме стария стил с рамки, ако е инжектиран
    const old = document.getElementById('col1StylesLeanSynced');
    if (old) old.remove();
    if (document.getElementById('col1StylesSimple')) return;

    const css = `
    /* —— Column 1 (simple, no boxes) —— */
    :root {
      --c1-left-nudge: -12px; /* пипни това за ляв маргин при нужда */
    }
    .th-col1 {
      margin-left: var(--c1-left-nudge) !important;
      min-width: 0;
    }
  
    .c1 {
      --text:  #e9ebf1;
      --muted: #b9bfcb;
  
      width: 100%;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-sizing: border-box;
    }
  
    .c1__title {
      margin: 0;
      padding: 0;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: .2px;
      color: var(--text);
      text-align: left;
    }
  
    /* НЯМА рамки/outline/background — само въздух и типография */
    .c1__group { margin-top: 2px; }
  
    .c1__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }
    .c1__label { font-size: 12px; color: var(--muted); }
    .c1__count {
      font-size: 11px; line-height: 1;
      padding: 0 6px;
      border-radius: 999px;
      color: var(--text);
      background: rgba(255,255,255,0.06); /* лек чип, без граница */
    }
  
    .c1__list {
      list-style: none; margin: 0; padding: 0;
      display: grid; gap: 4px;
      grid-auto-rows: minmax(0, auto);
      max-height: 112px;
      overflow: auto; overscroll-behavior: contain;
    }
  
    .c1__item {
      display: grid;
      grid-template-columns: 9px 1fr;
      align-items: center;
      column-gap: 6px;
      min-width: 0;
    }
    .c1__item--empty { opacity: .6; font-style: italic; }
  
    .c1__dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: linear-gradient(180deg, #c6c9d0, #9aa0a8); /* неутрална точка */
      display: inline-block;
    }
    .c1__email {
      color: var(--text);
      font-size: 12px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
  
    @media (max-width: 900px) {
      .c1 { max-width: 100%; }
    }
    `;
    const style = document.createElement('style');
    style.id = 'col1StylesSimple';
    style.textContent = css;
    document.head.appendChild(style);
}
