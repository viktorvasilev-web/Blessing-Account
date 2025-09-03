import { updateAxieCount } from './global-menu/menu.js';
import { updateDailyAXPDisplay } from './global-menu/menu.js'; // 🆕 добавено

export function applyFilters() {
    const selectedClass = $(".class-buttons button.active").data("class") || "";
    const geneSearch = $("#filterGene").val().toLowerCase();

    const selectedBreeds = $(".breed-buttons button.active")
        .map((_, btn) => $(btn).data("breed")?.toString())
        .get();

    const activeLevelBtns = $(".level-btn.active").not("#btn-all-levels");
    const selectedLevelRanges = activeLevelBtns.map((_, btn) => {
        return {
            min: parseInt($(btn).data("min")),
            max: parseInt($(btn).data("max"))
        };
    }).get();

    const allLevelsSelected = $("#btn-all-levels").hasClass("active");

    const collectionFilterState = typeof window.getCollectionFilterState === "function"
        ? window.getCollectionFilterState()
        : 1;

    const isAscendFilterOn = document.getElementById('ascendFilterBtn')?.classList.contains('active');
    const purityThreshold = parseInt($("#purityRange").val()) || 0;

    const selectedWallet = window.__ACTIVE_ACCOUNT_FILTER__?.toLowerCase() || "all";

    let visibleCount = 0;
    let ascendVisibleCount = 0;
    let dailyAXPSum = 0; // 🆕 за AXP Today

    $(".axie-card").each(function () {
        const $card = $(this);
        const cardClass = $card.data("class");
        const cardBreed = $card.data("breed")?.toString();
        const cardLevel = parseInt($card.data("level"));
        const cardGenes = $card.data("genes") || "";
        const hasCollection = $card.data("has-collection") === true || $card.data("has-collection") === "true";
        const shouldAscend = String($card.data("should-ascend")).toLowerCase() === "true";
        const cardPurity = parseFloat($card.data("purity")) || 0;

        // ✅ При липса на делегация → основен акаунт
        let cardDelegation = $card.data("delegation")?.toLowerCase() || "";
        if (!cardDelegation) {
            cardDelegation = "viktorsfsl@gmail.com";
        }

        const matchesDelegation = selectedWallet === "all" || cardDelegation === selectedWallet;
        const matchesClass = !selectedClass || cardClass == selectedClass;
        const matchesBreed = selectedBreeds.includes("0-7") || selectedBreeds.includes(cardBreed);
        const matchesLevel = allLevelsSelected || selectedLevelRanges.some(range =>
            cardLevel >= range.min && cardLevel <= range.max
        );
        const matchesGene = !geneSearch || cardGenes.includes(geneSearch);

        let matchesCollection = true;
        if (collectionFilterState === 0) matchesCollection = hasCollection;
        else if (collectionFilterState === 2) matchesCollection = !hasCollection;

        const matchesAscend = !isAscendFilterOn || shouldAscend;
        const matchesPurity = cardPurity >= purityThreshold;

        const show = matchesClass && matchesBreed && matchesLevel && matchesGene &&
            matchesCollection && matchesAscend && matchesPurity && matchesDelegation;

        $card.toggle(show);

        if (show) {
            visibleCount++;
            if (shouldAscend) ascendVisibleCount++;

            // 🆕 събиране на AXP Today
            const axpToday = parseInt($card.attr("data-xp-today")) || 0;
            dailyAXPSum += axpToday;
        }
    });

    updateAxieCount(visibleCount);
    ensureAscendCounterExists();
    updateAscendCount(ascendVisibleCount);
    updateDailyAXPDisplay(dailyAXPSum); // 🆕 подава стойността към менюто

    document.dispatchEvent(new CustomEvent('filters:applied', {
        detail: {
            visibleCount,
            ascendVisibleCount,
            dailyAXPSum, // 🆕
            timestamp: Date.now()
        }
    }));
}

export function toggleAscendFilter() {
    const btn = document.getElementById('ascendFilterBtn');
    btn.classList.toggle('active');
    applyFilters();
}

export function updateAscendCount(count) {
    const span = document.getElementById('ascendCount');
    if (span) span.textContent = `(${count})`;
}

export function ensureAscendCounterExists() {
    const btn = document.getElementById('ascendFilterBtn');
    if (!btn) return;

    let span = document.getElementById('ascendCount');
    if (!span) {
        span = document.createElement('span');
        span.id = 'ascendCount';
        span.style.marginLeft = '6px';
        btn.appendChild(span);
    }
}

// 🆕 глобално достъпно
window.applyFilters = applyFilters;
