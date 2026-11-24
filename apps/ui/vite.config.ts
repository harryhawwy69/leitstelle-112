import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Im Build eine strikte CSP als Meta-Tag setzen (zusätzlich zum Header des app://-Protokolls).
 * Im Dev-Modus nicht, weil Vite/React-Refresh Inline-Skripte und WebSockets braucht.
 */
function cspMeta(): Plugin {
  return {
    name: 'ls112-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; worker-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'" />`,
      ),
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), cspMeta()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome140',
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
