// calculateMemento.js

const MEMENTO_TABLE = {
    0: { 0: 6, 10: 7, 20: 9, 30: 12, 40: 17, 50: 19, 60: 28 },
    1: { 0: 13, 10: 15, 20: 20, 30: 28, 40: 38, 50: 44, 60: 63 },
    2: { 0: 25, 10: 75, 20: 100, 30: 138, 40: 188, 50: 219, 60: 313 },
    3: { 0: 37.5, 10: 118, 20: 157, 30: 216, 40: 294, 50: 343, 60: 490 },
    4: { 0: 50, 10: 210, 20: 280, 30: 385, 40: 525, 50: 613, 60: 875 },
    5: { 0: 62.5, 10: 252, 20: 336, 30: 462, 40: 630, 50: 735, 60: 1050 },
    6: { 0: 75, 10: 272, 20: 362, 30: 498, 40: 679, 50: 792, 60: 1132 },
    7: { 0: 87.5, 10: 293, 20: 390, 30: 537, 40: 732, 50: 854, 60: 1220 }
};

// 👉 Работещ мапинг, който заменя само визуалните форми като "Aqua"
const CLASS_NAME_MAP = {
    Aqua: 'Aquatic'
};

export function calculateMemento(level, breedCount) {
    let levelCategory;
    if (level >= 0 && level <= 9) levelCategory = 0;
    else if (level <= 19) levelCategory = 10;
    else if (level <= 29) levelCategory = 20;
    else if (level <= 39) levelCategory = 30;
    else if (level <= 49) levelCategory = 40;
    else if (level <= 59) levelCategory = 50;
    else if (level >= 60) levelCategory = 60;
    else return 0;

    return MEMENTO_TABLE[breedCount]?.[levelCategory] || 0;
}

export function getMementoForCard(row) {
    const totalMemento = calculateMemento(row.Level, row.BreedCount);
    const classMemento = {};

    let mementoSource = row.Memento;

    if (!mementoSource || typeof mementoSource !== 'string') {
        const baseClass = CLASS_NAME_MAP[row.Class] || row.Class;
        if (baseClass && typeof baseClass === 'string') {
            mementoSource = `100% ${baseClass}`;
        } else {
            return {
                total: totalMemento,
                classMemento: {},
                partMemento: {}
            };
        }
    }

    const parts = mementoSource.split(',').map(p => p.trim());

    parts.forEach(part => {
        const match = part.match(/^([\d.]+)%\s+(\w+)/);
        if (match) {
            const percent = parseFloat(match[1]);
            const rawClass = match[2];
            const normalizedClass = CLASS_NAME_MAP[rawClass] || rawClass;

            const mementoValue = Math.round((totalMemento * percent) / 100);
            classMemento[normalizedClass] = mementoValue;
        }
    });

    return {
        total: totalMemento,
        classMemento: classMemento,
        partMemento: {}
    };
}
