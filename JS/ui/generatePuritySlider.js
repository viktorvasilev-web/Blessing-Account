import { applyFilters } from '../filter-utils.js';

export function generatePuritySlider() {
    // Премахни предишния ако случайно го има (за да няма дублиране)
    const existing = document.getElementById('purityFilterWrapper');
    if (existing) existing.remove();

    // Създаваме обвивка
    const wrapper = document.createElement('div');
    wrapper.id = 'purityFilterWrapper';
    wrapper.style.marginTop = '10px';

    // Горен ред: "Purity {val}%"
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.alignItems = 'center';
    topRow.style.gap = '8px';
    topRow.style.marginBottom = '4px';

    const label = document.createElement('div');
    label.textContent = 'Purity';
    label.style.fontWeight = 'bold';
    label.style.background = '#2c2c2c';
    label.style.color = '#ffffff';
    label.style.padding = '2px 6px';
    label.style.display = 'inline-block';
    label.style.borderRadius = '6px';

    const valueLabel = document.createElement('div');
    valueLabel.id = 'puritySliderValue';
    valueLabel.textContent = '0%';
    valueLabel.style.fontWeight = 'bold';
    valueLabel.style.background = '#2c2c2c';
    valueLabel.style.color = '#ffffff';
    valueLabel.style.display = 'inline-block';
    valueLabel.style.padding = '2px 6px';
    valueLabel.style.borderRadius = '6px';

    topRow.appendChild(label);
    topRow.appendChild(valueLabel);

    // Слайдер
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.step = '1';
    slider.value = '0';
    slider.id = 'purityRange';
    slider.style.width = '100%';
    slider.style.marginTop = '5px';

    // Слушател – обновява процента и прилага филтрите
    slider.addEventListener('input', () => {
        const val = parseInt(slider.value, 10) || 0;
        valueLabel.textContent = `${val}%`;
        applyFilters();
    });

    // Сглобяване
    wrapper.appendChild(topRow);
    wrapper.appendChild(slider);

    // Вмъкваме го под Level слайдера
    const levelContainer = document.getElementById('levelInputContainer');
    if (levelContainer) {
        levelContainer.appendChild(wrapper);
    }
}
