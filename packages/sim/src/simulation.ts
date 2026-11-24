import { EventQueue } from './event-queue';
import { hashValue } from './hash';
import { Rng } from './rng';
import { MS_PER_HOUR, TICK_MS, toCalendar } from './time';
import {
  RNG_STREAMS,
  SNAPSHOT_VERSION,
  type CallState,
  type LoggedCommand,
  type RngStreamName,
  type ScheduledPayload,
  type SimCommand,
  type SimConfig,
  type SimEvent,
  type SimSnapshot,
  type SimState,
  type SimView,
} from './types';

/**
 * Vorgabe-Tagesprofil für Notrufe im Rettungsdienst (Annahme, docs/domain/einsatzaufkommen.md):
 * Minimum in den frühen Morgenstunden, Maximum am späten Vormittag. Mittelwert = 1.
 */
export const DEFAULT_HOURLY_PROFILE: readonly number[] = [
  0.6, 0.5, 0.45, 0.4, 0.4, 0.5, 0.75, 1.0, 1.25, 1.4, 1.45, 1.45, 1.35, 1.3, 1.25, 1.2, 1.2, 1.15,
  1.1, 1.05, 1.0, 0.9, 0.8, 0.7,
];

export function defaultConfig(overrides: Partial<SimConfig> = {}): SimConfig {
  return {
    seed: 112,
    startTime: 0,
    callRatePerHour: 6,
    hourlyProfile: DEFAULT_HOURLY_PROFILE,
    abandonAfterSeconds: [45, 180],
    ...overrides,
  };
}

function validateConfig(config: SimConfig): void {
  if (!Number.isInteger(config.seed) || config.seed < 0 || config.seed > 0xffffffff) {
    throw new RangeError('seed muss eine ganze Zahl zwischen 0 und 2^32-1 sein');
  }
  if (!Number.isInteger(config.startTime)) {
    throw new RangeError('startTime muss ganzzahlig sein (ms)');
  }
  if (config.hourlyProfile.length !== 24) {
    throw new RangeError('hourlyProfile braucht genau 24 Werte');
  }
  if (config.callRatePerHour < 0 || config.hourlyProfile.some((f) => f < 0)) {
    throw new RangeError('Raten dürfen nicht negativ sein');
  }
  const [min, max] = config.abandonAfterSeconds;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) {
    throw new RangeError('abandonAfterSeconds muss ein Intervall ganzer Sekunden ≥ 1 sein');
  }
}

function formatCallId(n: number): string {
  return `N${n.toString().padStart(6, '0')}`;
}

/**
 * Der Simulationskern. Rein deterministisch: Der Verlauf hängt nur von Konfiguration,
 * Seed und der Folge der Befehle (mit Tick-Nummer) ab.
 *
 * Ablauf eines Ticks ({@link Simulation.step}):
 * 1. Spielzeit um {@link TICK_MS} weiterstellen.
 * 2. Vorgemerkte Befehle in Eingangsreihenfolge anwenden.
 * 3. Fällige geplante Ereignisse abarbeiten (Zeitpunkt, dann Sequenznummer).
 * 4. Systeme ausführen (M1: Notrufgenerator).
 */
export class Simulation {
  private state: SimState;
  private readonly queue: EventQueue<ScheduledPayload>;
  private readonly rng: Record<RngStreamName, Rng>;
  private pending: SimCommand[];
  private readonly log: LoggedCommand[] = [];

  private constructor(
    readonly config: SimConfig,
    state: SimState,
    queue: EventQueue<ScheduledPayload>,
    rng: Record<RngStreamName, Rng>,
    pending: SimCommand[],
  ) {
    this.state = state;
    this.queue = queue;
    this.rng = rng;
    this.pending = pending;
  }

  static create(config: SimConfig): Simulation {
    validateConfig(config);
    const rng = {} as Record<RngStreamName, Rng>;
    for (const name of RNG_STREAMS) {
      rng[name] = Rng.stream(config.seed, name);
    }
    const state: SimState = {
      time: config.startTime,
      tick: 0,
      nextId: 1,
      calls: [],
      stats: { callsReceived: 0, callsAccepted: 0, callsAbandoned: 0, totalWaitMs: 0 },
    };
    return new Simulation(config, state, new EventQueue(), rng, []);
  }

  static restore(snapshot: SimSnapshot): Simulation {
    // Snapshots kommen aus Dateien; der Typ garantiert die Version zur Laufzeit nicht.
    if ((snapshot.version as number) !== SNAPSHOT_VERSION) {
      throw new RangeError(`Snapshot-Version ${String(snapshot.version)} wird nicht unterstützt`);
    }
    validateConfig(snapshot.config);
    const rng = {} as Record<RngStreamName, Rng>;
    for (const name of RNG_STREAMS) {
      rng[name] = Rng.fromState(snapshot.rng[name]);
    }
    return new Simulation(
      snapshot.config,
      structuredCloneJson(snapshot.state),
      EventQueue.fromJSON(structuredCloneJson(snapshot.queue)),
      rng,
      [...snapshot.pending],
    );
  }

  get time(): number {
    return this.state.time;
  }

  get tick(): number {
    return this.state.tick;
  }

  /** Merkt einen Befehl für den nächsten Tick vor. */
  submit(command: SimCommand): void {
    this.pending.push(command);
  }

  /** Protokoll aller angewendeten Befehle seit Erzeugung bzw. Wiederherstellung. */
  commandLog(): readonly LoggedCommand[] {
    return this.log;
  }

  /** Führt genau einen Tick aus und liefert die dabei entstandenen Ereignisse. */
  step(): SimEvent[] {
    const events: SimEvent[] = [];
    const tick = this.state.tick + 1;
    const time = this.state.time + TICK_MS;
    this.state = { ...this.state, tick, time };

    const commands = this.pending;
    this.pending = [];
    for (const command of commands) {
      this.log.push({ tick, command });
      this.apply(command, events);
    }

    for (let due = this.queue.popDue(time); due; due = this.queue.popDue(time)) {
      this.handleScheduled(due.payload, events);
    }

    this.generateCalls(events);
    return events;
  }

  /** Führt `count` Ticks aus und sammelt alle Ereignisse. */
  run(count: number): SimEvent[] {
    const all: SimEvent[] = [];
    for (let i = 0; i < count; i++) {
      all.push(...this.step());
    }
    return all;
  }

  snapshot(): SimSnapshot {
    const rng = {} as Record<RngStreamName, ReturnType<Rng['state']>>;
    for (const name of RNG_STREAMS) {
      rng[name] = this.rng[name].state();
    }
    return structuredCloneJson({
      version: SNAPSHOT_VERSION,
      config: this.config,
      state: this.state,
      rng,
      queue: this.queue.toJSON(),
      pending: this.pending,
    });
  }

  /** Prüfsumme über den gesamten Zustand inkl. Zufalls- und Warteschlangenzustand. */
  hash(): string {
    return hashValue(this.snapshot());
  }

  view(): SimView {
    return {
      time: this.state.time,
      tick: this.state.tick,
      waitingCalls: this.state.calls,
      stats: this.state.stats,
    };
  }

  /**
   * Ein Handler je Befehlstyp. Der Mapped Type erzwingt zur Compile-Zeit, dass jeder neue
   * Befehl einen Handler bekommt.
   */
  private readonly commandHandlers: {
    readonly [K in SimCommand['type']]: (
      command: Extract<SimCommand, { type: K }>,
      events: SimEvent[],
    ) => void;
  } = {
    'call/accept': (command, events) => {
      this.acceptCall(command.callId, events);
    },
  };

  private readonly scheduledHandlers: {
    readonly [K in ScheduledPayload['kind']]: (
      payload: Extract<ScheduledPayload, { kind: K }>,
      events: SimEvent[],
    ) => void;
  } = {
    'call/abandon': (payload, events) => {
      this.abandonCall(payload.callId, events);
    },
  };

  private apply(command: SimCommand, events: SimEvent[]): void {
    const handler = this.commandHandlers[command.type];
    handler(command, events);
  }

  private handleScheduled(payload: ScheduledPayload, events: SimEvent[]): void {
    const handler = this.scheduledHandlers[payload.kind];
    handler(payload, events);
  }

  private acceptCall(callId: string, events: SimEvent[]): void {
    const call = this.state.calls.find((c) => c.id === callId);
    if (!call) {
      events.push({
        type: 'command/rejected',
        at: this.state.time,
        command: 'call/accept',
        reason: 'unknownCall',
      });
      return;
    }
    const waitedMs = this.state.time - call.receivedAt;
    this.removeCall(call.id);
    this.state = {
      ...this.state,
      stats: {
        ...this.state.stats,
        callsAccepted: this.state.stats.callsAccepted + 1,
        totalWaitMs: this.state.stats.totalWaitMs + waitedMs,
      },
    };
    events.push({ type: 'call/accepted', at: this.state.time, callId: call.id, waitedMs });
  }

  private abandonCall(callId: string, events: SimEvent[]): void {
    // Wurde der Anruf inzwischen angenommen, ist das geplante Auflegen gegenstandslos.
    if (!this.state.calls.some((c) => c.id === callId)) return;
    this.removeCall(callId);
    this.state = {
      ...this.state,
      stats: { ...this.state.stats, callsAbandoned: this.state.stats.callsAbandoned + 1 },
    };
    events.push({ type: 'call/abandoned', at: this.state.time, callId });
  }

  /**
   * Notrufe als Bernoulli-Prozess je Tick (p = Rate × Δt). Bei Raten weit unter einem Anruf
   * pro Sekunde ist das eine sehr gute Näherung an einen Poisson-Prozess und kommt ohne
   * Logarithmus aus (Determinismus, ADR-0004).
   */
  private generateCalls(events: SimEvent[]): void {
    const { hour } = toCalendar(this.state.time);
    const factor = this.config.hourlyProfile[hour] ?? 1;
    const p = (this.config.callRatePerHour * factor * TICK_MS) / MS_PER_HOUR;
    if (!this.rng.calls.chance(p)) return;

    const id = formatCallId(this.state.nextId);
    const call: CallState = { id, receivedAt: this.state.time, status: 'waiting' };
    this.state = {
      ...this.state,
      nextId: this.state.nextId + 1,
      calls: [...this.state.calls, call],
      stats: { ...this.state.stats, callsReceived: this.state.stats.callsReceived + 1 },
    };
    const [min, max] = this.config.abandonAfterSeconds;
    const patienceMs = this.rng.callers.nextInt(min, max) * 1000;
    this.queue.schedule(this.state.time + patienceMs, { kind: 'call/abandon', callId: id });
    events.push({ type: 'call/incoming', at: this.state.time, callId: id });
  }

  private removeCall(id: string): void {
    this.state = { ...this.state, calls: this.state.calls.filter((c) => c.id !== id) };
  }
}

/** Tiefe Kopie über JSON – der Zustand enthält per Definition nur JSON-Werte. */
function structuredCloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Spielt ein Befehlsprotokoll von Beginn an nach (Replays, Bugreports). */
export function replay(
  config: SimConfig,
  log: readonly LoggedCommand[],
  ticks: number,
): Simulation {
  const sim = Simulation.create(config);
  let i = 0;
  for (let t = 1; t <= ticks; t++) {
    while (i < log.length && (log[i] as LoggedCommand).tick === t) {
      sim.submit((log[i] as LoggedCommand).command);
      i++;
    }
    sim.step();
  }
  return sim;
}
