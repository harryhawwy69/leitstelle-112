// Entwicklungsmodus: Vite-Dev-Server für die UI starten, Desktop bauen, Electron öffnen.
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEV_URL = 'http://localhost:5173/';
const isWin = process.platform === 'win32';

function run(cmd, args, options = {}) {
  return spawn(cmd, args, { stdio: 'inherit', shell: isWin, ...options });
}

async function waitFor(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server noch nicht bereit.
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Dev-Server unter ${url} nicht erreichbar`);
}

const vite = run('pnpm', [
  '--filter',
  '@ls112/ui',
  'exec',
  'vite',
  '--port',
  '5173',
  '--strictPort',
]);

const builder = run('node', [join(root, 'scripts/build.mjs'), '--no-renderer'], { cwd: root });
await new Promise((resolve, reject) =>
  builder.on('exit', (code) =>
    code === 0 ? resolve() : reject(new Error('Build fehlgeschlagen')),
  ),
);
await waitFor(DEV_URL);

const electron = run('pnpm', ['exec', 'electron', '.'], {
  cwd: root,
  env: { ...process.env, LS112_DEV_URL: DEV_URL },
});
electron.on('exit', (code) => {
  vite.kill();
  process.exit(code ?? 0);
});
