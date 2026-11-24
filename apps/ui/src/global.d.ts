/** Vom Preload bereitgestellte Brücke (apps/desktop/src/preload). Fehlt im reinen Browser. */
interface Ls112Bridge {
  log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>): void;
  appInfo(): Promise<{ version: string; electron: string; simHostRestarts: number }>;
  e2eCrashSimHost(): void;
}

interface Window {
  readonly ls112?: Ls112Bridge;
}
