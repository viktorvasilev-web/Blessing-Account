// JS/view-controller.js
import { setupGlobalMenu } from "./global-menu/menu.js";

/* 🔧 Единствен активен изглед: AXP */
window.viewOptions = {
    axp: {
        showGeneTable: true,
        showAXP: true,
        showDelegation: true,
        showMemento: true,
    },
};

function setBodyClass(view) {
    document.body.classList.remove("basic-view", "axp-view");
    document.body.classList.add(`${view}-view`);
}

/* Изчаква до ~4s да се появи window.originalAxieData от csv-loader */
function waitForCSVData(maxMs = 4000, stepMs = 100) {
    return new Promise((resolve) => {
        const start = Date.now();
        const timer = setInterval(() => {
            if (Array.isArray(window.originalAxieData) && window.originalAxieData.length) {
                clearInterval(timer);
                resolve(true);
            } else if (Date.now() - start > maxMs) {
                clearInterval(timer);
                resolve(false);
            }
        }, stepMs);
    });
}

async function startAXPOnly() {
    // 1) Глобално меню
    setupGlobalMenu();

    // 2) Фиксираме изгледа на AXP
    window.currentView = "axp";
    window.currentViewConfig = window.viewOptions.axp;
    setBodyClass("axp");

    // 3) Скриваме и зануляваме view switcher-а (нямаме Basic)
    const viewSwitcher = document.getElementById("viewSwitcher");
    if (viewSwitcher) {
        viewSwitcher.style.display = "none";
        viewSwitcher.innerHTML = "";
    }

    // 4) Зареждаме картите от CSV
    const csvModule = await import("./csv-loader.js");
    csvModule.loadCSVandRenderAxies();

    // 5) Изчакваме CSV данните да се запишат в window.originalAxieData
    await waitForCSVData();

    // 6) Инжектираме AXP данни върху картите
    try {
        const axpModule = await import("./axp-loader.js");
        if (typeof axpModule.injectAXPData === "function") {
            axpModule.injectAXPData(window.originalAxieData || []);
        }
    } catch (err) {
        console.error("AXP inject failed:", err);
    }
}

/* Старт */
window.addEventListener("DOMContentLoaded", startAXPOnly);
