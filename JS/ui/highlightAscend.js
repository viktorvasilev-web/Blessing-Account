export function highlightShouldAscend(axieCard, row) {
    const shouldAscend = row.ShouldAscend?.toString().trim().toUpperCase();
    if (shouldAscend === "TRUE") {
        const levelEl = axieCard.querySelector('.level-wrapper');
        if (levelEl) {
            levelEl.classList.add('ascend-highlight');
        }
    }
}
