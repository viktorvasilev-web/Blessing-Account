// JS/csv-loader.js
import { generateClassButtons } from '/JS/ui/generateClassButtons.js';
import { generateBreedButtons } from '/JS/ui/generateBreedButtons.js';
import { generateLevelButtons } from '/JS/ui/generateLevelButtons.js';
import { generateLevelSlider } from '/JS/ui/generateLevelSlider.js';
import { updateAxieCount, updateDailyAXPSummary } from '/JS/global-menu/menu.js';
import { renderAxieCard } from '/JS/renderAxieCard.js';
import { classColors, collectionIcons } from '/JS/config.js';
import { generateCollectionSwitch } from '/JS/ui/generateCollectionSwitch.js';
import { toggleAscendFilter } from '/JS/filter-utils.js';
import { generatePuritySlider } from '/JS/ui/generatePuritySlider.js';
// import { renderAccountFilterDropdown } from '/JS/ui/accountfilter.js'; // по избор: скрий го

// ✅ Показваме САМО този акаунт (важи за всички изгледи, включително Basic View)
const TARGET_WALLET = "0x9218f8aa46faae8081d7a2d1e20bd135fcf76aea".toLowerCase();

// Намира колоната за делегация и сравнява
function rowMatchesWallet(row, wallet) {
    const w = wallet.toLowerCase();
    const keys = [
        'Delegation', 'delegation', 'Wallet', 'wallet', 'Ronin', 'ronin',
        'Account', 'account', 'Delegate', 'delegate', 'delegationAddress'
    ];
    for (const k of keys) {
        if (row[k] && String(row[k]).toLowerCase().includes(w)) return true;
    }
    return false;
}

export function loadCSVandRenderAxies() {
    const csvUrl = "https://raw.githubusercontent.com/viktorvasilev-web/AxieAXP/main/decoded_axies.csv";

    return fetch(csvUrl)
        .then(r => { if (!r.ok) throw new Error("CSV файлът не беше намерен."); return r.text(); })
        .then(csvText => {
            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        const container = $("#axieContainer").empty();
                        const classSet = new Set();
                        const breedSet = new Set();
                        const levelSet = new Set();
                        const seenIds = new Set();
                        const duplicates = [];

                        // ✅ Филтрираме само за таргет акаунта
                        const filtered = results.data.filter(row => rowMatchesWallet(row, TARGET_WALLET));

                        // 📊 Суми за AXP Today / Yesterday от колоната AXPtoday: "Today: X, Yesterday: Y"
                        const totals = filtered.reduce((acc, row) => {
                            const s = (row.AXPtoday || row.axptoday || "").toString();
                            const m = /Today:\s*(\d+)\s*,\s*Yesterday:\s*(\d+)/i.exec(s);
                            if (m) {
                                acc.today += Number(m[1]);
                                acc.yesterday += Number(m[2]);
                            }
                            return acc;
                        }, { today: 0, yesterday: 0 });

                        // Обновяваме дисплея в глобалното меню
                        updateDailyAXPSummary(totals);

                        // 🔔 HOOK за графиката и други слушатели
                        try {
                            window.__AXP_TOTALS__ = totals;
                            document.dispatchEvent(new CustomEvent('axpTotalsUpdated', { detail: totals }));
                        } catch (e) {
                            console.warn('axpTotalsUpdated dispatch failed:', e);
                        }

                        // използваме само филтрираните данни навсякъде
                        window.__ACTIVE_ACCOUNT_FILTER__ = TARGET_WALLET;
                        window.originalAxieData = filtered;

                        filtered
                            .sort((a, b) => (parseInt(b.Level) || 0) - (parseInt(a.Level) || 0))
                            .forEach(row => {
                                const rawId = row.ID?.toString().trim();
                                if (!rawId) return;
                                if (seenIds.has(rawId)) { duplicates.push(rawId); return; }
                                seenIds.add(rawId);

                                container.append(
                                    renderAxieCard(row, classColors, collectionIcons, window.currentViewConfig)
                                );

                                classSet.add(row.Class);
                                breedSet.add(row.BreedCount);
                                levelSet.add(row.Level);
                            });

                        updateAxieCount($(".axie-card").length);

                        if (duplicates.length) {
                            console.warn("⚠️ Дублирани Axie ID-та:", duplicates);
                        } else {
                            console.log("✅ Няма дублирани Axie ID-та");
                        }

                        // UI филтри
                        generateClassButtons(classSet);
                        generateBreedButtons();
                        generateLevelButtons();
                        generateCollectionSwitch();
                        generateLevelSlider();
                        generatePuritySlider();

                        const ascendBtn = document.getElementById('ascendFilterBtn');
                        if (ascendBtn) ascendBtn.addEventListener('click', toggleAscendFilter);

                        // 👉 Ако искаш да скриеш дропдауна за акаунти, просто НЕ го извиквай:
                        // renderAccountFilterDropdown();

                        resolve(filtered);
                    },
                    error: function (err) {
                        console.error("Papa.parse error:", err);
                        reject(err);
                    }
                });
            });
        })
        .catch(err => {
            console.error("Грешка при зареждане на CSV:", err);
            throw err;
        });
}
