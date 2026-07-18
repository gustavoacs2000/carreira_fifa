import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const appModules = [
  'app-core.js',
  'app-roster.js',
  'app-calendar.js',
  'app-transfers-stats.js',
  'app-tactics.js',
  'app-render.js'
];
const requiredFiles = [
  'index.html',
  'privacidade.html',
  'assets/app.css',
  'assets/cloud.css',
  'assets/responsive.css',
  'assets/styles.css',
  'assets/favicon.svg',
  'assets/seed-data.js',
  'assets/bootstrap.js',
  ...appModules.map(file => `assets/js/${file}`),
  'src/auth.js',
  'supabase/migrations/202607150001_initial.sql',
  'supabase/functions/delete-account/index.ts',
  'dist/index.html',
  'dist/privacidade.html',
  'dist/assets/auth.js',
  'dist/assets/vendor/supabase.js',
  'dist/assets/favicon.svg',
  'dist/assets/styles.css',
  'dist/assets/bootstrap.js',
  ...appModules.map(file => `dist/assets/js/${file}`),
  'vercel.json'
];

const contents = Object.fromEntries(await Promise.all(requiredFiles.map(async file => [
  file,
  await readFile(resolve(root, file), 'utf8')
])));

new Function(contents['assets/seed-data.js']);
new Function(appModules.map(file => contents[`assets/js/${file}`]).join('\n'));
new Function(contents['assets/bootstrap.js']);
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
  'modal-negociar',
  'modal-contratar',
  'modal-promover',
  'modal-evento',
  'modal-relatorio',
  'modal-view-rel',
  'modal-livro-caixa',
  'modal-competicoes',
  'timeline-bar',
  'inbox-panel',
  'app-shell',
  'auth-screen',
  'age-confirm',
  'google-login',
  'mobile-account',
  'sync-status',
  'account-email'
];

for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Elemento obrigatório ausente: #${id}`);
}

for (const asset of [
  'assets/favicon.svg',
  'assets/app.css',
  'assets/cloud.css',
  'assets/responsive.css',
  'assets/seed-data.js',
  'assets/vendor/supabase.js',
  'assets/auth.js',
  ...appModules.map(file => `assets/js/${file}`),
  'assets/bootstrap.js'
]) {
  if (!html.includes(asset)) throw new Error(`Referência ausente no HTML: ${asset}`);
}

if (!/^<!doctype html>/i.test(html.trimStart()) || !html.trimEnd().endsWith('</html>')) {
  throw new Error('O documento HTML tem conteúdo inválido antes ou depois da página.');
}

const application = appModules.map(file => contents[`assets/js/${file}`]).join('\n');
for (const feature of [
  'renderTimeline',
  'abrirRelatorioPartida',
  'abrirLivroCaixa',
  'confirmarNegocio',
  'confirmarContrato',
  'abrirModalCompeticoes',
  'excluirSelecionados',
  'verificarEventosNarrativos',
  'comprimirTudo'
]) {
  if (!application.includes(feature)) throw new Error(`Função nova ausente: ${feature}`);
}
if (application.includes('ManagerCloud')) {
  throw new Error('Os módulos novos ainda dependem da camada antiga de sincronização.');
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

const auth = contents['dist/assets/auth.js'];
if (auth.includes('APP_PUBLIC_URL')) {
  throw new Error('A autenticação não deve depender de uma URL pública incorporada no build.');
}
if (!auth.includes('`${window.location.origin}${window.location.pathname}`')) {
  throw new Error('O retorno da autenticação deve usar a URL atual do aplicativo.');
}

console.log('Verificação concluída: interface, autenticação, privacidade, RLS e build da Vercel estão válidos.');
