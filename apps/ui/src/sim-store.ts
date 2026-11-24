import { create } from 'zustand';
import {
  PROTOCOL_VERSION,
  type ClientMessage,
  type HostMessage,
  type HostSnapshot,
  type Speed,
} from '@ls112/protocol';

type SimEventList = Extract<HostMessage, { type: 'events' }>['events'];
export type SimEventEntry = SimEventList[number] & { readonly key: number };

/** Wie viele Ereignisse das Protokoll im Speicher hält. */
export const EVENT_LOG_LIMIT = 500;

interface SimStore {
  status: 'connecting' | 'connected' | 'disconnected';
  state: HostSnapshot | undefined;
  events: readonly SimEventEntry[];
  send: (message: ClientMessage) => void;
  togglePause: () => void;
  setSpeed: (speed: Speed) => void;
  acceptOldestCall: () => void;
}

let port: MessagePort | undefined;
let eventKey = 0;

/**
 * Zustand des Fensters, ausschließlich gespeist aus Nachrichten des Sim-Hosts.
 * Keine Spiellogik: Aktionen werden nur als Nachrichten weitergereicht (CLAUDE.md, Regel 4).
 */
export const useSim = create<SimStore>((_set, get) => ({
  status: 'connecting',
  state: undefined,
  events: [],
  send: (message) => {
    port?.postMessage(message);
  },
  togglePause: () => {
    get().send({ type: 'clock/togglePause' });
  },
  setSpeed: (speed) => {
    get().send({ type: 'clock/setSpeed', speed });
  },
  acceptOldestCall: () => {
    const oldest = get().state?.waitingCalls[0];
    if (oldest)
      get().send({ type: 'sim/command', command: { type: 'call/accept', callId: oldest.id } });
  },
}));

function handleHostMessage(message: HostMessage): void {
  switch (message.type) {
    case 'welcome':
      useSim.setState({ status: 'connected' });
      return;
    case 'state':
      useSim.setState({ state: message.state, status: 'connected' });
      return;
    case 'events': {
      const entries = message.events.map((e) => ({ ...e, key: eventKey++ }));
      useSim.setState((s) => ({
        events: [...entries.reverse(), ...s.events].slice(0, EVENT_LOG_LIMIT),
      }));
      return;
    }
    case 'error':
      window.ls112?.log('warn', 'Sim-Host meldet Fehler', { code: message.code });
      return;
  }
}

/** Nimmt den vom Preload übergebenen MessagePort entgegen (auch nach Neustart des Sim-Hosts). */
export function connectToSimHost(view: string): void {
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    const data = event.data as { type?: unknown } | null;
    if (event.source !== window || data?.type !== 'ls112:sim-port') return;
    const next = event.ports[0];
    if (!next) return;
    port?.close();
    port = next;
    port.onmessage = (e: MessageEvent<HostMessage>) => {
      handleHostMessage(e.data);
    };
    port.addEventListener('close', () => {
      useSim.setState({ status: 'disconnected' });
    });
    port.start();
    port.postMessage({ type: 'hello', protocol: PROTOCOL_VERSION, view } satisfies ClientMessage);
  });
}
