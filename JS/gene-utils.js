import { cleanPythonStyleJSON } from './utils.js';

export function createGeneCellsOnly(geneDataRaw, classColors) {
  let data;
  try {
    data = JSON.parse(cleanPythonStyleJSON(geneDataRaw));
  } catch (e) {
    return `<td colspan="3" style="color:red">⚠️</td>`;
  }

  const getCell = (gene) => {
    const name = gene?.name || gene?.id?.split("-").slice(1).join(" ") || '';
    const className = gene?.class || '';
    const color = classColors[className] || '#000';
    return `<td style="color:${color}">${name}</td>`;
  };

  return `<tr>${getCell(data.d)}${getCell(data.r1)}${getCell(data.r2)}</tr>`;
}
