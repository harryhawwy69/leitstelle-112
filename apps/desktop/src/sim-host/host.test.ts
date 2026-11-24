import { describe, expect, it } from 'vitest';
import { defaultConfig, simTimeFrom } from '@ls112/sim';
import type { HostMessage } from '@ls112/protocol';
import { SimHost, type ClientPort } from './host';

class FakePort implements ClientPort {
  readonly received: HostMessage[] = [];
  private messageListener: ((data: unknown) => void) | undefined;
  private closeListener: (() => void) | undefined;
  postMessage(message: HostMessage): void {
    this.received.push(message);
  }
  onMessage(listener: (data: unknown) => void): void {
    this.messageListener = listener;
  }
  onClose(listener: () => void): void {
    this.closeListener = listener;
  }
  send(data: unknown): void {
    this.messageListener?.(data);
  }
  close(): void {
    this.closeListener?.();
  }
  last<T extends HostMessage['type']>(type: T): Extract<HostMessage, { type: T }> | undefined {
    return this.received.filter((m) => m.type === type).at(-1) as
      Extract<HostMessage, { type: T }> | undefined;
  }
}

const silent = { info: () => undefined, warn: () => undefined };

function makeHost(): SimHost {
  return new SimHost(
    defaultConfig({ seed: 1, startTime: simTimeFrom(2026, 11, 24, 7), callRatePerHour: 600 }),
    silent,
  );
}

describe('SimHost', () => {
  it('begrüßt neue Fenster mit Protokollversion und Zustand', () => {
    const host = makeHost();
    const port = new FakePort();
    host.addClient(port);
    expect(port.received.map((m) => m.type)).toEqual(['welcome', 'state']);
    expect(host.clientCount).toBe(1);
  });

  it('läuft im Takt und verteilt Zustand gedrosselt', () => {
    const host = makeHost();
    const port = new FakePort();
    host.addClient(port);
    for (let i = 0; i < 20; i++) host.update(50); // 1 s Echtzeit
    expect(host.sim.tick).toBe(1);
    const states = port.received.filter((m) => m.type === 'state');
    expect(states.length).toBeLessThanOrEqual(1 + 10);
  });

  it('setzt Pause und Zeitraffer aus Nachrichten', () => {
    const host = makeHost();
    const port = new FakePort();
    host.addClient(port);
    port.send({ type: 'clock/setSpeed', speed: 10 });
    host.update(1000);
    expect(host.sim.tick).toBe(10);
    port.send({ type: 'clock/setPaused', paused: true });
    host.update(5000);
    expect(host.sim.tick).toBe(10);
    expect(port.last('state')?.state.paused).toBe(true);
  });

  it('leitet gültige Befehle an die Simulation weiter', () => {
    const host = makeHost();
    const port = new FakePort();
    host.addClient(port);
    port.send({ type: 'clock/setSpeed', speed: 10 });
    while (host.sim.view().waitingCalls.length === 0) host.update(1000);
    const callId = host.sim.view().waitingCalls[0]!.id;
    port.send({ type: 'sim/command', command: { type: 'call/accept', callId } });
    host.update(100);
    const events = port.received.flatMap((m) => (m.type === 'events' ? m.events : []));
    expect(events.some((e) => e.type === 'call/accepted' && e.callId === callId)).toBe(true);
  });

  it('wendet Befehle auch in der Pause sofort an', () => {
    const host = makeHost();
    const port = new FakePort();
    host.addClient(port);
    port.send({ type: 'clock/setSpeed', speed: 10 });
    while (host.sim.view().waitingCalls.length === 0) host.update(1000);
    port.send({ type: 'clock/togglePause' });
    const tick = host.sim.tick;
    const callId = host.sim.view().waitingCalls[0]!.id;
    port.send({ type: 'sim/command', command: { type: 'call/accept', callId } });
    expect(host.sim.tick).toBe(tick);
    expect(port.last('events')?.events).toEqual([
      expect.objectContaining({ type: 'call/accepted', callId }),
    ]);
  });

  it('schaltet die Pause bei schnellem Doppeldruck sauber hin und zurück', () => {
    const host = makeHost();
    const port = new FakePort();
    host.addClient(port);
    port.send({ type: 'clock/togglePause' });
    port.send({ type: 'clock/togglePause' });
    expect(host.clock.paused).toBe(false);
  });

  it('weist ungültige Nachrichten zurück und vergisst geschlossene Fenster', () => {
    const host = makeHost();
    const port = new FakePort();
    host.addClient(port);
    port.send({ type: 'sim/command', command: { type: 'reboot' } });
    expect(port.last('error')?.code).toBe('badMessage');
    port.close();
    expect(host.clientCount).toBe(0);
  });
});
