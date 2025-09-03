// JS/global-menu/top-header/col3.js
// Свободен слот за бъдещи добавки – например AXP Today/Yesterday, търсачка, бързи филтри.

export function renderCol3(mount) {
    if (!mount) return;
    // по подразбиране – празно, готово за бъдещи компоненти
    mount.innerHTML = '';
}

/* По желание: публична функция за обновяване на AXP сумите в колона 3 */
export function setAXPSummary({ today = 0, yesterday = 0 } = {}) {
    const el = document.getElementById('th-col3');
    if (!el) return;
    el.innerHTML = `
      <div class="axp-summary">
        📊 AXP Today: <b>${Number(today).toLocaleString()}</b>,
        Yesterday: <b>${Number(yesterday).toLocaleString()}</b>
      </div>
    `;
}
