import { applyFilters } from '/JS/filter-utils.js';

export function generateLevelButtons() {
    const levelButtonsContainer = $(`
    <div class="level-buttons">
      <div class="level-header">
        <span class="level-label">Levels</span>
        <button class="level-btn wide-btn" id="btn-all-levels" data-range="1-60">1-60</button>
      </div>
      <div class="level-row row1"></div>
      <div class="level-row row2"></div>
    </div>
  `);

    const levelRanges = [
        { label: "1-10", min: 1, max: 10 },
        { label: "11-20", min: 11, max: 20 },
        { label: "21-30", min: 21, max: 30 },
        { label: "31-40", min: 31, max: 40 },
        { label: "41-50", min: 41, max: 50 },
        { label: "51-60", min: 51, max: 60 },
    ];

    function createLevelButton(range) {
        const btn = $(`<button class="level-btn" data-min="${range.min}" data-max="${range.max}">${range.label}</button>`);
        btn.on("click", function () {
            $("#btn-all-levels").removeClass("active");
            $(this).toggleClass("active");

            const anyActive = $(".level-btn.active").not("#btn-all-levels").length > 0;
            if (!anyActive) {
                $("#btn-all-levels").addClass("active");
            }

            applyFilters();
        });
        return btn;
    }

    levelRanges.slice(0, 3).forEach(r => levelButtonsContainer.find(".row1").append(createLevelButton(r)));
    levelRanges.slice(3, 6).forEach(r => levelButtonsContainer.find(".row2").append(createLevelButton(r)));

    levelButtonsContainer.find("#btn-all-levels").on("click", function () {
        $(".level-btn").removeClass("active");
        $(this).addClass("active");
        applyFilters();
    });

    levelButtonsContainer.find("#btn-all-levels").addClass("active");

    $("#filterLevel").replaceWith(levelButtonsContainer);
}
