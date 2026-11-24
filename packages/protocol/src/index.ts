/**
 * Protokoll zwischen Sim-Host und Fenstern (ADR-0005).
 *
 * Richtung UI → Host: {@link ClientMessage}. Richtung Host → UI: {@link HostMessage}.
 * Alle Nachrichten sind strukturiert klonbar (MessagePort) und enthalten keine Texte.
 */
import type { CalendarTime, CallState, SimCommand, SimEvent, SimStats } from '@ls112/sim';

/** Erlaubte Zeitraffer-Stufen. */
export const SPEEDS = [1, 2, 5, 10] as const;
export type Speed = (typeof SPEEDS)[number];

export const PROTOCOL_VERSION = 1;

export type ClientMessage =
  | { readonly type: 'hello'; readonly protocol: number; readonly view: string }
  | { readonly type: 'clock/setPaused'; readonly paused: boolean }
  /** Umschalten entscheidet der Host – sonst gehen schnelle Doppelklicks verloren. */
  | { readonly type: 'clock/togglePause' }
  | { readonly type: 'clock/setSpeed'; readonly speed: Speed }
  | { readonly type: 'sim/command'; readonly command: SimCommand };

/** Zustand, den jedes Fenster für die Anzeige braucht (M1). */
export interface HostSnapshot {
  readonly time: number;
  readonly calendar: CalendarTime;
  readonly tick: number;
  readonly paused: boolean;
  readonly speed: Speed;
  readonly waitingCalls: readonly CallState[];
  readonly stats: SimStats;
}

export type HostMessage =
  | { readonly type: 'welcome'; readonly protocol: number; readonly seed: number }
  | { readonly type: 'state'; readonly state: HostSnapshot }
  | { readonly type: 'events'; readonly events: readonly SimEvent[] }
  | { readonly type: 'error'; readonly code: 'protocolMismatch' | 'badMessage' };

export function isSpeed(value: unknown): value is Speed {
  return typeof value === 'number' && (SPEEDS as readonly number[]).includes(value);
}

/**
 * Prüft eingehende Nachrichten am Sim-Host. Fenster gelten als nicht vertrauenswürdig
 * (Mods, Fehler im UI), deshalb wird jede Nachricht strukturell validiert.
 */
export function parseClientMessage(data: unknown): ClientMessage | undefined {
  if (typeof data !== 'object' || data === null) return undefined;
  const msg = data as Record<string, unknown>;
  switch (msg.type) {
    case 'hello':
      return typeof msg.protocol === 'number' && typeof msg.view === 'string'
        ? { type: 'hello', protocol: msg.protocol, view: msg.view }
        : undefined;
    case 'clock/setPaused':
      return typeof msg.paused === 'boolean'
        ? { type: 'clock/setPaused', paused: msg.paused }
        : undefined;
    case 'clock/togglePause':
      return { type: 'clock/togglePause' };
    case 'clock/setSpeed':
      return isSpeed(msg.speed) ? { type: 'clock/setSpeed', speed: msg.speed } : undefined;
    case 'sim/command': {
      const command = parseSimCommand(msg.command);
      return command ? { type: 'sim/command', command } : undefined;
    }
    default:
      return undefined;
  }
}

function parseSimCommand(data: unknown): SimCommand | undefined {
  if (typeof data !== 'object' || data === null) return undefined;
  const cmd = data as Record<string, unknown>;
  if (cmd.type === 'call/accept' && typeof cmd.callId === 'string' && cmd.callId.length < 64) {
    return { type: 'call/accept', callId: cmd.callId };
  }
  return undefined;
}
