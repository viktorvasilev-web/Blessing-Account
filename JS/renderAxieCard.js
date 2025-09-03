// JS/renderAxieCard.js
import { createGeneCellsOnly } from './gene-utils.js';
import { getMementoForCard } from './calculateAxieValue/calculateMemento.js';
import { classColors, classIcons } from './config.js';
import { highlightShouldAscend } from './ui/highlightAscend.js';

export function renderAxieCard(row, classColorsOverride = classColors, collectionIcons, viewConfig) {
  const id = row.ID;
  const link = `https://app.axieinfinity.com/marketplace/axies/${id}`;
  const mementoData = getMementoForCard(row);

  const axieCard = document.createElement('div');
  axieCard.className = 'axie-card';
  axieCard.setAttribute('data-id', id);
  axieCard.setAttribute('data-class', row.Class);
  axieCard.setAttribute('data-breed', row.BreedCount);
  axieCard.setAttribute('data-level', row.Level);
  axieCard.setAttribute('data-original-csv-level', row.Level);
  axieCard.setAttribute('data-has-collection', row.specialCollection && row.specialCollection !== '{}' ? 'true' : 'false');
  axieCard.setAttribute('data-genes', Object.values(row).join(' ').toLowerCase());
  axieCard.setAttribute('data-should-ascend', row.ShouldAscend?.toLowerCase());
  axieCard.setAttribute('data-purity', row.Purity || 0);
  axieCard.setAttribute('data-memento', row.Memento || `100% ${row.Class}`);
  axieCard.setAttribute('data-special-collection', row.specialCollection || '');
  axieCard.setAttribute('data-delegation', row.Delegation?.toLowerCase() || "");

  const safeXp = (typeof row.xpToday === 'number') ? row.xpToday : (parseInt(row.xpToday) || 0);
  axieCard.setAttribute('data-xp-today', safeXp);

  const displayClassNameMap = { Aqua: 'Aquatic' };

  const mementoBreakdown = Object.entries(mementoData.classMemento)
    .filter(([cls]) => cls !== 'total')
    .map(([cls, val]) => {
      const displayCls = displayClassNameMap[cls] || cls;
      const icon = classIcons?.[displayCls];
      return icon
        ? `<span class="memento-class"><img src="${icon}" title="${displayCls}" class="memento-icon"> x${val}</span>`
        : '';
    })
    .join(' ');

  let axpTodayStr = '';
  if (row.AXPtoday && row.AXPtoday.includes("Today")) {
    try {
      const match = row.AXPtoday.match(/Today:\s*(\d+),\s*Yesterday:\s*(\d+)/);
      if (match) {
        const today = match[1];
        const yest = match[2];
        axpTodayStr = `${today} AXP, ${yest} AXP`;
      }
    } catch (e) {
      console.warn("Неуспешен parse на AXPtoday за Axie ID:", id, row.AXPtoday);
    }
  }

  const specialCollectionsHTML = (() => {
    try {
      const special = JSON.parse((row.specialCollection || '').replace(/'/g, '"'));
      if (special && typeof special === 'object') {
        return `
          <div class="special-collections-top-right">
            ${Object.entries(special).map(([key, count]) => {
          const icon = collectionIcons?.[key];
          return icon
            ? (count === 1
              ? `<img src="${icon}" title="${key}" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;">`
              : `<img src="${icon}" title="${key}" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"><span>x${count}</span>`)
            : (count === 1 ? `${key}` : `${key} <span>x${count}</span>`);
        }).join("<br>")}
          </div>
        `;
      }
    } catch (e) {
      console.warn("Грешка при парсване на specialCollection за Axie ID:", id, e);
    }
    return "";
  })();

  const geneTableHTML = (viewConfig?.showGeneTable && window.currentView !== "axp")
    ? `
      <table class="gene-table">
        <tbody>
          ${[
      createGeneCellsOnly(row.eyes, classColorsOverride),
      createGeneCellsOnly(row.ears, classColorsOverride),
      createGeneCellsOnly(row.mouth, classColorsOverride),
      createGeneCellsOnly(row.horn, classColorsOverride),
      createGeneCellsOnly(row.back, classColorsOverride),
      createGeneCellsOnly(row.tail, classColorsOverride)
    ].join("")}
        </tbody>
      </table>
    `
    : '';

  axieCard.innerHTML = `
    <a href="${link}" target="_blank" style="text-decoration: none; color: inherit; display: block; height: 100%;">
      <img class="axie-img" src="https://axiecdn.axieinfinity.com/axies/${id}/axie/axie-full-transparent.png" />

      <!-- 🔙 ВРЪЩАМЕ ЛЕЙБЪЛА ПРЕДИ СЛОТА, както беше -->
      ${axpTodayStr ? `<div class="axp-today-label">${axpTodayStr}</div>` : ''}

      <!-- СЛОТ ЗА 18-ДНЕВНАТА AXP ГРАФИКА -->
      <div class="axp-slot" data-axp-slot></div>

      ${window.currentView !== "axp" ? `<div class="memento-breakdown">${mementoBreakdown}</div>` : ''}
      ${window.currentView !== "axp" ? `<div class="axie-summary-line"><div class="min-value-placeholder"></div></div>` : ''}

      <div class="axie-header">
        <div class="level-wrapper ${row.ShouldAscend === "TRUE" ? 'ascend-highlight' : ''}" 
             data-tooltip="Days to Ascend: ${Math.round(row.DaysToAscend) || 'N/A'}">
          <span class="level-badge">${row.Level}</span>
        </div>

        <div class="breed-info">
          <img
            src="https://i2.seadn.io/ronin/0x32950db2a7164ae833121501c797d79e7b79d74c/abeda5764ad8af562792fd7aafc369/12abeda5764ad8af562792fd7aafc369.png?w=1000"
            alt="Breed Icon"
            class="breed-icon"
          />
          ${row.BreedCount}
        </div>

        <div class="purity-info">
          <span class="genes-emoji" role="img" aria-label="Genes">🧬</span>
          ${row.Purity || 'N/A'}%
        </div>
      </div>

      ${specialCollectionsHTML}
      ${geneTableHTML}
    </a>
  `;

  // Важно: не пипай innerHTML на axieCard след този момент
  highlightShouldAscend(axieCard, row);

  return axieCard;
}
