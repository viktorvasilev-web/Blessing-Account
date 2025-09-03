window.updateTotalAxpToday = function () {
    const cards = document.querySelectorAll(".axie-card");
    let total = 0;

    cards.forEach(card => {
        const isVisible = card.offsetParent !== null;
        if (!isVisible) return;

        const xp = parseInt(card.getAttribute("data-xp-today")) || 0;
        total += xp;
    });

    const span = document.getElementById("axpTodaySum");
    if (span) {
        span.textContent = total.toLocaleString();
    }
};
