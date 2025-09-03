// JS/global-menu/top-header/col2/time.js
// Всичко се изчислява по стенен час на Europe/Sofia,
// независимo от часовата зона на браузъра/OS.
import { CUT_HOUR, CUT_MIN } from './config.js';

const TZ = 'Europe/Sofia';

// Строи "локален" Date обект с календарните компоненти за дадена зона.
// Този Date е удобен за y/m/d сметки, commit маркери и cutoff сравнения.
function nowInTZ(timeZone = TZ) {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    }).formatToParts(now);
    const get = (t) => Number(parts.find(p => p.type === t).value);
    // Връщаме Date с тези компоненти (наивен локален обект; достатъчно за нашите цели)
    return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'), 0);
}

export function nowLocal() {
    return nowInTZ(TZ);
}

export function todayCutoff(ref = nowLocal()) {
    // Cutoff в 03:00 по BG стенен час
    return new Date(
        ref.getFullYear(),
        ref.getMonth(),
        ref.getDate(),
        CUT_HOUR,
        CUT_MIN,
        0,
        0
    );
}

export function msUntilNextCutoff() {
    const n = nowLocal();
    const cut = todayCutoff(n);
    if (n < cut) return cut - n;
    const tmr = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, CUT_HOUR, CUT_MIN, 0, 0);
    return tmr - n;
}

export function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
}

export function getDaysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

export function monthKeyOf(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

export function monthNameEnOf(d) {
    // Месечното име също по BG зона (иначе при друга зона може да "прескочи" месец)
    return d.toLocaleString('en-US', { month: 'long', timeZone: TZ });
}
