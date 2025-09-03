// ✅ Извлича нивото от data-атрибут (работи със стрелките)
export function getAxieLevel(cardElement) {
    const levelStr = cardElement.getAttribute("data-level");
    return parseInt(levelStr) || 0;
}

// Проверява дали Axie има флаг shouldAscend (показва се икона)
export function getAxieShouldAscend(cardElement) {
    return !!cardElement.querySelector('.ascend-icon');
}

// Извлича типа на специална колекция, ако има (напр. Mystic, Xmas и др.)
export function getAxieCollection(cardElement) {
    const iconEl = cardElement.querySelector('.collection-icon');
    return iconEl?.getAttribute('data-collection') || "";
}

// Извлича Axie ID от линка
export function getAxieId(cardElement) {
    const link = cardElement.querySelector('a[href*="axie"]');
    const match = link?.href?.match(/\/axie\/(\d+)/);
    return match ? parseInt(match[1]) : null;
}
