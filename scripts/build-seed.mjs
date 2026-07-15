import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

function toPlayer(columns) {
  return {
    primeiroNome: columns[0].trim(),
    sobrenome: columns[1].trim(),
    num: columns[2].trim(),
    pos: columns[3].trim(),
    status: columns[4].trim(),
    situacao: columns[5].trim(),
    idade: Number(columns[6]),
    alt: Number(columns[7]),
    pe: columns[8].trim(),
    contAnos: Number(columns[9]),
    contMeses: Number(columns[10]),
    multa: Number(columns[11]),
    valor: Number(columns[12]),
    salario: Number(columns[13]),
    ovr: Number(columns[14]),
    pot: Number(columns[15]),
    dr: Number(columns[16]),
    pr: Number(columns[17]),
    s: columns.slice(18, 24).map(Number),
    est: {}
  };
}

async function loadPlayers(fileName) {
  const text = await readFile(resolve(root, 'data', fileName), 'utf8');
  return parseCSV(text.replace(/^\uFEFF/, ''))
    .slice(1)
    .filter(columns => columns.length >= 24)
    .map(toPlayer);
}

const seed = {
  elenco: await loadPlayers('elenco.csv'),
  base: await loadPlayers('base.csv'),
  mercado: await loadPlayers('mercado.csv')
};

const output = `// Gerado por scripts/build-seed.mjs a partir dos CSVs em /data.\nwindow.MANAGER_FC_SEED = ${JSON.stringify(seed, null, 2)};\n`;
await writeFile(resolve(root, 'assets', 'seed-data.js'), output, 'utf8');

console.log(`Seed gerado: ${seed.elenco.length} no elenco, ${seed.base.length} na base e ${seed.mercado.length} no mercado.`);
