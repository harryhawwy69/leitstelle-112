import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { arch, release } from 'node:os';

export interface CrashContext {
  readonly process: string;
  readonly appVersion: string;
  /** Zusätzliche Daten, z. B. Seed, Tick und letzte Befehle aus dem Sim-Host. */
  readonly extra?: Record<string, unknown>;
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { value: String(error) };
}

/**
 * Schreibt einen lokalen Crash-Report als JSON (ADR-0012). Nichts verlässt den Rechner.
 * Gibt den Dateipfad zurück oder `undefined`, wenn selbst das Schreiben scheitert.
 */
export function writeCrashReport(
  dir: string,
  context: CrashContext,
  error: unknown,
  now = new Date(),
): string | undefined {
  try {
    mkdirSync(dir, { recursive: true });
    const stamp = now.toISOString().replace(/[:.]/g, '-');
    const file = join(dir, `crash-${stamp}-${context.process}.json`);
    const report = {
      time: now.toISOString(),
      process: context.process,
      appVersion: context.appVersion,
      os: { platform: process.platform, release: release(), arch: arch() },
      node: process.versions.node,
      electron: process.versions.electron,
      error: serializeError(error),
      ...context.extra,
    };
    writeFileSync(file, JSON.stringify(report, null, 2), 'utf8');
    return file;
  } catch {
    return undefined;
  }
}
