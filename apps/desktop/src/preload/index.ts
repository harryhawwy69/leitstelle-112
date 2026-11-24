/**
 * Preload (sandboxed): stellt nur eine minimale, typisierte Brücke bereit (ADR-0005).
 * Der MessagePort zum Sim-Host wird per window.postMessage an die Seite übergeben,
 * weil Ports nicht über contextBridge transportiert werden können.
 */
import { contextBridge, ipcRenderer } from 'electron';

export interface Ls112Bridge {
  log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>): void;
  appInfo(): Promise<{ version: string; electron: string; simHostRestarts: number }>;
  e2eCrashSimHost(): void;
}

const bridge: Ls112Bridge = {
  log: (level, message, context) => {
    ipcRenderer.send('renderer-log', level, message, context ?? {});
  },
  appInfo: () =>
    ipcRenderer.invoke('app-info') as Promise<{
      version: string;
      electron: string;
      simHostRestarts: number;
    }>,
  e2eCrashSimHost: () => {
    ipcRenderer.send('e2e-crash-sim-host');
  },
};

contextBridge.exposeInMainWorld('ls112', bridge);

ipcRenderer.on('sim-port', (event) => {
  window.postMessage({ type: 'ls112:sim-port' }, '*', event.ports);
});
