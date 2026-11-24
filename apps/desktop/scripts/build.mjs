// Bündelt Main, Preload und Sim-Host mit esbuild und übernimmt den gebauten Renderer.
import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const watchless = process.argv.includes('--no-renderer');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const common = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  sourcemap: 'linked',
  external: ['electron'],
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
};

await Promise.all([
  build({
    ...common,
    entryPoints: [join(root, 'src/main/index.ts')],
    outfile: join(dist, 'main.cjs'),
  }),
  build({
    ...common,
    entryPoints: [join(root, 'src/preload/index.ts')],
    outfile: join(dist, 'preload.cjs'),
  }),
  build({
    ...common,
    entryPoints: [join(root, 'src/sim-host/index.ts')],
    outfile: join(dist, 'sim-host.cjs'),
  }),
]);

if (!watchless) {
  const rendererDist = join(root, '..', 'ui', 'dist');
  if (!existsSync(join(rendererDist, 'index.html'))) {
    console.error('Renderer fehlt – zuerst `pnpm --filter @ls112/ui build` ausführen.');
    process.exit(1);
  }
  cpSync(rendererDist, join(dist, 'renderer'), { recursive: true });
}

console.log(`Desktop ${pkg.version} gebaut → ${dist}`);
