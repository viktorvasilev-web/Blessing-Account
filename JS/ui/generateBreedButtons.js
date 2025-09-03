// 📁 /JS/ui/generateBreedButtons.js
import { applyFilters } from '/JS/filter-utils.js';

export function generateBreedButtons(breedSet) {
    const breedButtonsContainer = $(
        `<div class="breed-buttons">
      <div class="breed-header">
        <span class="breed-label">Breeds</span>
        <button class="breed-btn wide-btn" id="btn-all-breeds" data-breed="0-7">0-7</button>
      </div>
      <div class="breed-row row1"></div>
      <div class="breed-row row2"></div>
    </div>`
    );

    const row1 = ['0', '1', '2', '3'];
    const row2 = ['4', '5', '6', '7'];

    function createBreedButton(breed) {
        const btn = $(`<button class="breed-btn" data-breed="${breed}">${breed}</button>`);
        btn.on("click", function () {
            $(".breed-btn[data-breed='0-7']").removeClass("active");
            $(this).toggleClass("active");

            const anyActive = $(".breed-btn.active").not("[data-breed='0-7']").length > 0;
            if (!anyActive) {
                $(".breed-btn[data-breed='0-7']").addClass("active");
            }

            applyFilters();
        });
        return btn;
    }

    row1.forEach(b => breedButtonsContainer.find(".row1").append(createBreedButton(b)));
    row2.forEach(b => breedButtonsContainer.find(".row2").append(createBreedButton(b)));

    breedButtonsContainer.find("#btn-all-breeds").on("click", function () {
        $(".breed-btn").removeClass("active");
        $(this).addClass("active");
        applyFilters();
    });

    breedButtonsContainer.find("#btn-all-breeds").addClass("active");
    $("#filterBreed").replaceWith(breedButtonsContainer);
}
