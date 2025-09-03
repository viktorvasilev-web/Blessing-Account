// JS/global-menu/sorting-global-menu.js
import { getAxieLevel } from './global-menu-data-extract.js';

export function sortAxiesByLevel(order = "desc") {
  const cards = Array.from(document.querySelectorAll(".axie-card"));

  cards.sort((a, b) => {
    const levelA = getAxieLevel(a);
    const levelB = getAxieLevel(b);
    return order === "asc" ? levelA - levelB : levelB - levelA;
  });

  const container = document.getElementById("axieContainer");
  cards.forEach(card => container.appendChild(card));
}

export function sortAxiesByAXPToday(order = "asc") {
  const cards = Array.from(document.querySelectorAll(".axie-card"));

  cards.sort((a, b) => {
    const aVal = extractTodayAXP(a);
    const bVal = extractTodayAXP(b);
    return order === "asc" ? aVal - bVal : bVal - aVal;
  });

  const container = document.getElementById("axieContainer");
  cards.forEach(card => container.appendChild(card));
}

function extractTodayAXP(card) {
  const axpEl = card.querySelector('.axp-today-label');
  if (!axpEl) return 0;

  const match = axpEl.textContent.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}
