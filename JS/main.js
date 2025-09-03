// main.js

import { cleanPythonStyleJSON, extractID } from './utils.js';
import { createGeneCellsOnly } from './gene-utils.js';
import { applyFilters } from './filter-utils.js';
import { renderAxieCard } from './renderAxieCard.js';
import { loadCSVandRenderAxies } from './csv-loader.js';

window.onload = loadCSVandRenderAxies;
