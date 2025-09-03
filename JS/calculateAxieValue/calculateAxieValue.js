export function calculateMinValue(row) {
    const prices = window.mementoPrices;
    if (!prices || !row.mementoBreakdown) return 0;

    let total = 0;
    for (const [mementoClass, amount] of Object.entries(row.mementoBreakdown)) {
        const pricePerUnit = prices[mementoClass.toLowerCase()] || 0;
        total += amount * pricePerUnit;
    }

    row.minValue = parseFloat(total.toFixed(2)); // Добавяме го към row
    return row.minValue;
}
