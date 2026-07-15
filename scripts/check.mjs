import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const requiredFiles = [
  'index.html',
  'privacidade.html',
  'assets/legacy.css',
  'assets/styles.css',
  'assets/favicon.svg',
  'assets/seed-data.js',
  'assets/app.js',
  'src/auth.js',
  'supabase/migrations/202607150001_initial.sql',
  'supabase/functions/delete-account/index.ts',
  'dist/index.html',
  'dist/privacidade.html',
  'dist/assets/auth.js',
  'dist/assets/vendor/supabase.js',
  'dist/assets/favicon.svg',
  'dist/assets/app.js',
  'vercel.json'
];

const contents = Object.fromEntries(await Promise.all(requiredFiles.map(async file => [
  file,
  await readFile(resolve(root, file), 'utf8')
])));

new Function(contents['assets/seed-data.js']);
new Function(contents['assets/app.js']);
new Function(contents['dist/assets/auth.js']);
new Function(`${contents['dist/assets/vendor/supabase.js']}\n${contents['dist/assets/auth.js']}`);
JSON.parse(contents['vercel.json']);

const html = contents['index.html'];
const requiredIds = [
  'squad-select',
  'season-select',
  'main-title',
  'filtros-container',
  'dashboard',
  'elenco-container',
  'modal-compra',
  'modal-venda',
  'modal-promover',
  'modal-evento',
  'auth-gate',
  'google-login',
  'sync-status',
  'account-email'
];

for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Elemento obrigatório ausente: #${id}`);
}

for (const asset of ['assets/favicon.svg', 'assets/legacy.css', 'assets/styles.css', 'assets/seed-data.js', 'assets/vendor/supabase.js', 'assets/auth.js', 'assets/app.js']) {
  if (!html.includes(asset)) throw new Error(`Referência ausente no HTML: ${asset}`);
}

if (!html.trimStart().startsWith('<!DOCTYPE html>') || !html.trimEnd().endsWith('</html>')) {
  throw new Error('O documento HTML tem conteúdo inválido antes ou depois da página.');
}

const sql = contents['supabase/migrations/202607150001_initial.sql'];
for (const requirement of ['enable row level security', 'auth.uid()', 'on delete cascade', 'save_my_career']) {
  if (!sql.toLowerCase().includes(requirement)) throw new Error(`Proteção ausente na migração: ${requirement}`);
}
if (/create\s+table[^;]+profiles/i.test(sql)) throw new Error('A migração não deve criar tabela de perfil.');

const privacy = contents['dist/privacidade.html'];
if (privacy.includes('{{DATA_CONTROLLER_NAME}}') || privacy.includes('{{PRIVACY_CONTACT_EMAIL}}')) {
  throw new Error('O Aviso de Privacidade ainda contém marcadores não processados.');
}

console.log('Verificação concluída: interface, autenticação, privacidade, RLS e build da Vercel estão válidos.');
