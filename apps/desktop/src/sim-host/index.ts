/**
 * Einstiegspunkt des Sim-Hosts (Electron utilityProcess, ADR-0005).
 * Empfängt vom Main-Prozess MessagePorts der Fenster und betreibt den Takt.
 */
import { randomInt } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { MessagePortMain } from 'electron';
import { defaultConfig, simTimeFrom } from '@ls112/sim';
import type { HostMessage } from '@ls112/protocol';
import { createLogger } from '../shared/logger';
import { writeCrashReport } from '../shared/crash';
import { SimHost, type ClientPort } from './host';

const LOOP_INTERVAL_MS = 50;

const logDir = process.env.LS112_LOG_DIR ?? '.';
const crashDir = process.env.LS112_CRASH_DIR ?? '.';
const appVersion = process.env.LS112_APP_VERSION ?? '0.0.0';
const log = createLogger(logDir, 'sim-host');

/** Schichtbeginn 07:00 am heutigen Tag (Ortszeit). Der Host darf die Systemzeit lesen. */
function shiftStart(): number {
  const now = new Date();
  return simTimeFrom(now.getFullYear(), now.getMonth() + 1, now.getDate(), 7, 0, 0);
}

const seed = process.env.LS112_SEED
  ? Number(process.env.LS112_SEED) >>> 0
  : randomInt(0, 2 ** 32 - 1);
// Nur für Tests: höhere Anrufrate, damit kurze E2E-Läufe Notrufe sehen.
const callRate = process.env.LS112_E2E === '1' ? Number(process.env.LS112_CALL_RATE) : NaN;
const host = new SimHost(
  defaultConfig({
    seed,
    startTime: shiftStart(),
    ...(Number.isFinite(callRate) && callRate > 0 ? { callRatePerHour: callRate } : {}),
  }),
  log,
);
log.info({ seed, appVersion }, 'Sim-Host gestartet');

function crash(error: unknown): never {
  const file = writeCrashReport(
    crashDir,
    {
      process: 'sim-host',
      appVersion,
      extra: {
        seed,
        tick: host.sim.tick,
        // Letzte Befehle: damit lässt sich der Absturz per Replay nachstellen.
        lastCommands: host.sim.commandLog().slice(-200),
      },
    },
    error,
  );
  log.fatal({ err: error, crashReport: file }, 'Sim-Host abgestürzt');
  log.flush();
  process.exit(1);
}

process.on('uncaughtException', crash);
process.on('unhandledRejection', crash);

function wrapPort(port: MessagePortMain): ClientPort {
  return {
    postMessage: (message: HostMessage) => {
      port.postMessage(message);
    },
    onMessage: (listener) =>
      port.on('message', (event) => {
        listener(event.data);
      }),
    onClose: (listener) => port.on('close', listener),
  };
}

process.parentPort.on('message', (event) => {
  const data = event.data as { type?: unknown } | undefined;
  if (data?.type === 'connect-window') {
    const port = event.ports[0];
    if (!port) return;
    host.addClient(wrapPort(port));
    port.start();
  } else if (data?.type === 'crash-test' && process.env.LS112_E2E === '1') {
    // Nur für E2E-Tests: provozierter Absturz, um die Wiederherstellung zu prüfen.
    throw new Error('Absichtlicher Testabsturz');
  }
});

let last = performance.now();
setInterval(() => {
  const now = performance.now();
  host.update(now - last);
  last = now;
}, LOOP_INTERVAL_MS);
