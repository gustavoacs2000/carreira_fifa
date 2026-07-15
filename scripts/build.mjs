import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = resolve(root, 'dist');

async function loadLocalEnv() {
  const path = resolve(root, '.env.local');
  try {
    const content = await readFile(path, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const separator = line.indexOf('=');
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

await loadLocalEnv();

const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://SEU-PROJETO.supabase.co',
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'PENDENTE',
  controller: process.env.DATA_CONTROLLER_NAME || 'CONFIGURAÇÃO PENDENTE: informe o controlador',
  privacyEmail: process.env.PRIVACY_CONTACT_EMAIL || 'privacidade@exemplo.invalid'
};

const missing = [];
if (!process.env.SUPABASE_URL || !/^https:\/\/.+\.supabase\.co$/i.test(config.supabaseUrl)) missing.push('SUPABASE_URL');
if (!process.env.SUPABASE_PUBLISHABLE_KEY || config.supabaseKey.length < 20) missing.push('SUPABASE_PUBLISHABLE_KEY');
if (!process.env.DATA_CONTROLLER_NAME) missing.push('DATA_CONTROLLER_NAME');
if (!process.env.PRIVACY_CONTACT_EMAIL) missing.push('PRIVACY_CONTACT_EMAIL');
if (process.env.VERCEL && missing.length) {
  throw new Error(`Publicação bloqueada: configure na Vercel ${missing.join(', ')}.`);
}

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'assets', 'vendor'), { recursive: true });

for (const file of ['index.html']) {
  await cp(resolve(root, file), resolve(dist, file));
}
for (const file of ['favicon.svg', 'legacy.css', 'styles.css', 'seed-data.js', 'app.js']) {
  await cp(resolve(root, 'assets', file), resolve(dist, 'assets', file));
}
await cp(resolve(root, 'data'), resolve(dist, 'data'), { recursive: true });
await cp(
  resolve(root, 'node_modules', '@supabase', 'supabase-js', 'dist', 'umd', 'supabase.js'),
  resolve(dist, 'assets', 'vendor', 'supabase.js')
);

let privacy = await readFile(resolve(root, 'privacidade.html'), 'utf8');
privacy = privacy
  .replaceAll('{{DATA_CONTROLLER_NAME}}', escapeHtml(config.controller))
  .replaceAll('{{PRIVACY_CONTACT_EMAIL}}', escapeHtml(config.privacyEmail));
await writeFile(resolve(dist, 'privacidade.html'), privacy, 'utf8');

let authSource = await readFile(resolve(root, 'src', 'auth.js'), 'utf8');
authSource = authSource
  .replace('__SUPABASE_URL__', JSON.stringify(config.supabaseUrl))
  .replace('__SUPABASE_PUBLISHABLE_KEY__', JSON.stringify(config.supabaseKey));
await writeFile(resolve(dist, 'assets', 'auth.js'), authSource, 'utf8');

const authSize = (await stat(resolve(dist, 'assets', 'auth.js'))).size;
console.log(`Build concluído em dist/ (${Math.round(authSize / 1024)} KB no módulo de autenticação).`);
if (missing.length) console.log(`Configuração local pendente: ${missing.join(', ')}.`);
