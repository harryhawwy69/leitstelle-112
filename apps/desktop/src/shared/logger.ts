import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import pino, { type Logger } from 'pino';

/** Aufbewahrungsdauer für Log-Dateien (ADR-0012). */
export const LOG_RETENTION_DAYS = 14;

/** Löscht Log- und Crash-Dateien, die älter als die Aufbewahrungsdauer sind. */
export function pruneOldFiles(dir: string, maxAgeDays: number, now = Date.now()): number {
  let removed = 0;
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return 0;
  }
  const limit = now - maxAgeDays * 24 * 60 * 60 * 1000;
  for (const name of names) {
    if (!name.endsWith('.log') && !name.endsWith('.json')) continue;
    const file = join(dir, name);
    try {
      if (statSync(file).mtimeMs < limit) {
        unlinkSync(file);
        removed++;
      }
    } catch {
      // Datei gerade gesperrt oder schon weg – beim nächsten Start erneut versuchen.
    }
  }
  return removed;
}

export function localDateStamp(date = new Date()): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Strukturierter JSON-Lines-Logger je Prozess. Eine Datei pro Prozess und Tag
 * (`main-2026-11-24.log`); alte Dateien werden beim Start aufgeräumt.
 */
export function createLogger(dir: string, processName: string): Logger {
  mkdirSync(dir, { recursive: true });
  pruneOldFiles(dir, LOG_RETENTION_DAYS);
  const destination = pino.destination({
    dest: join(dir, `${processName}-${localDateStamp()}.log`),
    sync: false,
    mkdir: true,
  });
  return pino(
    {
      base: { proc: processName, pid: process.pid },
      timestamp: pino.stdTimeFunctions.isoTime,
      level: process.env.LS112_LOG_LEVEL ?? 'info',
    },
    destination,
  );
}
