// utils.js

export function cleanPythonStyleJSON(raw) {
  return raw
    .replace(/'/g, '"')
    .replace(/\bNone\b/g, 'null')
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false');
}

export function extractID(cellValue) {
  const match = cellValue.match(/HYPERLINK\(".*\/(\d+)"\s*,\s*"(\d+)"\)/);
  return match ? match[1] : cellValue;
}
