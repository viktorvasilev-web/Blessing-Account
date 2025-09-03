// JS/global-menu/top-header/col2/storage.js
export function storageKeyForMonth(keyStr) { return `axp_daily_${keyStr}`; }
const COMMIT_MARKER_KEY = 'axp_last_yesterday_committed_ymd';

export function loadSeriesForMonth(monthKey, days) {
    try {
        const raw = localStorage.getItem(storageKeyForMonth(monthKey));
        if (!raw) return new Array(days).fill(null);
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return new Array(days).fill(null);
        const out = arr.slice(0, days);
        while (out.length < days) out.push(null);
        return out;
    } catch {
        return new Array(days).fill(null);
    }
}

export function saveSeriesForMonth(monthKey, series) {
    try { localStorage.setItem(storageKeyForMonth(monthKey), JSON.stringify(series)); } catch { }
}

export function getCommitMarker() {
    try { return localStorage.getItem(COMMIT_MARKER_KEY) || ''; } catch { return ''; }
}

export function setCommitMarker(ymdStr) {
    try { localStorage.setItem(COMMIT_MARKER_KEY, ymdStr); } catch { }
}
