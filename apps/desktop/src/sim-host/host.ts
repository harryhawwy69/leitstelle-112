import { Simulation, toCalendar, type SimConfig, type SimEvent } from '@ls112/sim';
import {
  PROTOCOL_VERSION,
  parseClientMessage,
  type HostMessage,
  type HostSnapshot,
} from '@ls112/protocol';
import { SimClock } from './clock';

/** Abstraktion eines Fensters – in Electron ein MessagePortMain, im Test ein Fake. */
export interface ClientPort {
  postMessage(message: HostMessage): void;
  onMessage(listener: (data: unknown) => void): void;
  onClose(listener: () => void): void;
}

export interface HostLogger {
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
}

/** Wie oft der Zustand höchstens an die Fenster geht (ADR-0005: bis 10 Hz). */
export const STATE_BROADCAST_INTERVAL_MS = 100;

/**
 * Verbindet Simulationskern, Zeitgeber und Fenster. Enthält selbst keine Spiellogik –
 * nur Takt, Nachrichtenvalidierung und Verteilung.
 */
export class SimHost {
  readonly sim: Simulation;
  readonly clock: SimClock;
  private readonly clients = new Set<ClientPort>();
  private sinceBroadcastMs = Number.POSITIVE_INFINITY;
  private dirty = true;

  constructor(
    config: SimConfig,
    private readonly log: HostLogger,
  ) {
    this.sim = Simulation.create(config);
    this.clock = new SimClock();
  }

  get clientCount(): number {
    return this.clients.size;
  }

  addClient(port: ClientPort): void {
    this.clients.add(port);
    port.onClose(() => this.clients.delete(port));
    port.onMessage((data) => {
      this.handleMessage(port, data);
    });
    port.postMessage({ type: 'welcome', protocol: PROTOCOL_VERSION, seed: this.sim.config.seed });
    port.postMessage({ type: 'state', state: this.snapshot() });
  }

  /** Vom Echtzeit-Takt aufgerufen; führt fällige Ticks aus und verteilt Ergebnisse. */
  update(realElapsedMs: number): void {
    const ticks = this.clock.advance(realElapsedMs);
    if (ticks > 0) {
      const events: SimEvent[] = [];
      for (let i = 0; i < ticks; i++) events.push(...this.sim.step());
      if (events.length > 0) this.broadcast({ type: 'events', events });
      this.dirty = true;
    }
    this.sinceBroadcastMs += realElapsedMs;
    if (this.dirty && this.sinceBroadcastMs >= STATE_BROADCAST_INTERVAL_MS) {
      this.broadcast({ type: 'state', state: this.snapshot() });
      this.sinceBroadcastMs = 0;
      this.dirty = false;
    }
  }

  snapshot(): HostSnapshot {
    const view = this.sim.view();
    return {
      time: view.time,
      calendar: toCalendar(view.time),
      tick: view.tick,
      paused: this.clock.paused,
      speed: this.clock.speed,
      waitingCalls: view.waitingCalls,
      stats: view.stats,
    };
  }

  private handleMessage(port: ClientPort, data: unknown): void {
    const msg = parseClientMessage(data);
    if (!msg) {
      this.log.warn({ data: summarize(data) }, 'Ungültige Nachricht verworfen');
      port.postMessage({ type: 'error', code: 'badMessage' });
      return;
    }
    switch (msg.type) {
      case 'hello':
        if (msg.protocol !== PROTOCOL_VERSION) {
          port.postMessage({ type: 'error', code: 'protocolMismatch' });
        }
        this.log.info({ view: msg.view }, 'Fenster verbunden');
        return;
      case 'clock/setPaused':
      case 'clock/togglePause': {
        const paused = msg.type === 'clock/setPaused' ? msg.paused : !this.clock.paused;
        this.clock.setPaused(paused);
        this.log.info({ paused, tick: this.sim.tick }, 'Pause umgeschaltet');
        this.markDirty();
        return;
      }
      case 'clock/setSpeed':
        this.clock.setSpeed(msg.speed);
        this.log.info({ speed: msg.speed, tick: this.sim.tick }, 'Zeitraffer geändert');
        this.markDirty();
        return;
      case 'sim/command': {
        // Sofort anwenden – auch in der Pause (Disponenten arbeiten bei stehender Zeit weiter).
        this.sim.submit(msg.command);
        const events = this.sim.flush();
        if (events.length > 0) this.broadcast({ type: 'events', events });
        this.markDirty();
        return;
      }
    }
  }

  private markDirty(): void {
    this.dirty = true;
    this.sinceBroadcastMs = Number.POSITIVE_INFINITY;
  }

  private broadcast(message: HostMessage): void {
    for (const client of this.clients) client.postMessage(message);
  }
}

function summarize(data: unknown): string {
  try {
    return JSON.stringify(data).slice(0, 200);
  } catch {
    return typeof data;
  }
}
