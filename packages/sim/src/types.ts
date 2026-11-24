import type { RngState } from './rng';
import type { Scheduled } from './event-queue';
import type { SimTime } from './time';

/** Namen der Zufalls-Streams. Neue Subsysteme bekommen einen eigenen Namen (ADR-0004). */
export const RNG_STREAMS = ['calls', 'callers'] as const;
export type RngStreamName = (typeof RNG_STREAMS)[number];

export interface SimConfig {
  /** Master-Seed, ganze Zahl 0 … 2^32-1. */
  readonly seed: number;
  /** Startzeitpunkt des Szenarios (Ortszeit). */
  readonly startTime: SimTime;
  /** Mittlere Anzahl eingehender Notrufe pro Stunde über den Tag. */
  readonly callRatePerHour: number;
  /**
   * Relativer Faktor je Stunde (Index 0 = 00:00–00:59), Mittelwert ≈ 1.
   * Wird in M3 aus den Inhalten geladen; hier nur die Struktur.
   */
  readonly hourlyProfile: readonly number[];
  /** Spanne, nach der ein wartender Anrufer auflegt, in Sekunden [min, max]. */
  readonly abandonAfterSeconds: readonly [number, number];
}

export type CallStatus = 'waiting';

export interface CallState {
  readonly id: string;
  readonly receivedAt: SimTime;
  readonly status: CallStatus;
}

export interface SimStats {
  readonly callsReceived: number;
  readonly callsAccepted: number;
  readonly callsAbandoned: number;
  /** Summe der Wartezeiten angenommener Anrufe in ms (für Durchschnitt). */
  readonly totalWaitMs: number;
}

/** Intern geplante Ereignisse. */
export type ScheduledPayload = { readonly kind: 'call/abandon'; readonly callId: string };

/** Vollständiger, serialisierbarer Zustand. Enthält nur JSON-kompatible Werte. */
export interface SimState {
  readonly time: SimTime;
  readonly tick: number;
  readonly nextId: number;
  readonly calls: readonly CallState[];
  readonly stats: SimStats;
}

/** Befehle sind die einzige Möglichkeit, den Zustand von außen zu verändern. */
export type SimCommand = { readonly type: 'call/accept'; readonly callId: string };

export type RejectReason = 'unknownCall';

/**
 * Ausgabe-Ereignisse. Sie enthalten keine Texte, nur Typ und Parameter;
 * das UI übersetzt sie über i18n-Schlüssel (CLAUDE.md, Regel 5).
 */
export type SimEvent =
  | { readonly type: 'call/incoming'; readonly at: SimTime; readonly callId: string }
  | {
      readonly type: 'call/accepted';
      readonly at: SimTime;
      readonly callId: string;
      readonly waitedMs: number;
    }
  | { readonly type: 'call/abandoned'; readonly at: SimTime; readonly callId: string }
  | {
      readonly type: 'command/rejected';
      readonly at: SimTime;
      readonly command: SimCommand['type'];
      readonly reason: RejectReason;
    };

export interface LoggedCommand {
  /** Tick, zu dessen Beginn der Befehl angewendet wurde. */
  readonly tick: number;
  readonly command: SimCommand;
}

/** Format-Version des Snapshots – bei inkompatiblen Änderungen erhöhen. */
export const SNAPSHOT_VERSION = 1;

export interface SimSnapshot {
  readonly version: typeof SNAPSHOT_VERSION;
  readonly config: SimConfig;
  readonly state: SimState;
  readonly rng: Readonly<Record<RngStreamName, RngState>>;
  readonly queue: {
    readonly nextSeq: number;
    readonly entries: readonly Scheduled<ScheduledPayload>[];
  };
  readonly pending: readonly SimCommand[];
}

/** Für die Anzeige aufbereiteter, schreibgeschützter Ausschnitt. */
export interface SimView {
  readonly time: SimTime;
  readonly tick: number;
  readonly waitingCalls: readonly CallState[];
  readonly stats: SimStats;
}
