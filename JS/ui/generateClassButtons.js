import { applyFilters } from '/JS/filter-utils.js';
import { classColors, classIcons } from '/JS/config.js';

export function generateClassButtons(classSet) {
    const classButtons = $("#filterClassButtons").empty();

    const desiredOrder = ["Plant", "Beast", "Bug", "Bird", "Reptile", "Aquatic", "Mech", "Dawn", "Dusk"];
    const classLabels = {
        Aquatic: "Aqua",
        Beast: "Beast",
        Plant: "Plant",
        Bug: "Bug",
        Bird: "Bird",
        Reptile: "Reptile",
        Mech: "Mech",
        Dawn: "Dawn",
        Dusk: "Dusk"
    };

    desiredOrder.forEach(cls => {
        if (!classSet.has(cls)) return;

        const color = classColors[cls] || "#666";
        const icon = classIcons[cls] || "";
        const label = classLabels[cls] || cls;

        const btn = $(`
            <button data-class="${cls}" style="background:${color}">
                <img src="${icon}" class="class-icon">${label}
            </button>
        `);

        btn.on("click", function () {
            const wasActive = $(this).hasClass("active");
            $(".class-buttons button").removeClass("active");
            if (!wasActive) $(this).addClass("active");
            applyFilters();
        });

        classButtons.append(btn);
    });
}
