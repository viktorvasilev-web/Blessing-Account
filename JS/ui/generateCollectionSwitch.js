import { applyFilters } from '/JS/filter-utils.js';

export function generateCollectionSwitch() {
    const container = $("#filterCollectionSwitch").empty();

    const switchHTML =
        `<div class="collection-switch">
            <span class="label label-left" data-state="0">Collectable</span>
            <span class="label label-center circle" data-state="1">All</span>
            <span class="label label-right" data-state="2">Memento</span>
        </div>`;

    container.html(switchHTML);

    let currentState = 1; // Default: All
    const labels = container.find(".label");

    function updateSelection() {
        labels.removeClass("selected");
        labels.eq(currentState).addClass("selected");
        applyFilters();
    }

    labels.on("click", function () {
        currentState = parseInt($(this).data("state"));
        updateSelection();
    });

    // Глобално за filter-utils.js
    window.getCollectionFilterState = () => currentState;

    updateSelection();
}
