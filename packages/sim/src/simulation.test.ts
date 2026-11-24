import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { Simulation, defaultConfig, replay } from './simulation';
import { MS_PER_HOUR, TICK_MS, simTimeFrom } from './time';
import type { SimCommand, SimConfig, SimSnapshot } from './types';

const START = simTimeFrom(2026, 11, 24, 8, 0, 0);

/** Viele Anrufe, damit auch kurze Läufe Ereignisse erzeugen. */
function busyConfig(seed: number): SimConfig {
  return defaultConfig({ seed, startTime: START, callRatePerHour: 120 });
}

/**
 * Zufälliges „Spielerverhalten": in jedem Tick mit gewisser Wahrscheinlichkeit den ältesten
 * wartenden Anruf annehmen – oder einen unbekannten, um Ablehnungen zu testen.
 */
const behaviourArb = fc.array(
  fc.constantFrom<'none' | 'accept' | 'bogus'>('none', 'none', 'accept', 'bogus'),
  {
    minLength: 50,
    maxLength: 400,
  },
);

function play(sim: Simulation, behaviour: readonly string[]): void {
  for (const action of behaviour) {
    const oldest = sim.view().waitingCalls[0];
    if (action === 'accept' && oldest) sim.submit({ type: 'call/accept', callId: oldest.id });
    if (action === 'bogus') sim.submit({ type: 'call/accept', callId: 'X-unbekannt' });
    sim.step();
  }
}

const seedArb = fc.integer({ min: 0, max: 0xffffffff });

describe('Simulation – Determinismus', () => {
  it('gleicher Seed + gleiche Befehle ⇒ gleicher Zustand', () => {
    fc.assert(
      fc.property(seedArb, behaviourArb, (seed, behaviour) => {
        const a = Simulation.create(busyConfig(seed));
        const b = Simulation.create(busyConfig(seed));
        play(a, behaviour);
        play(b, behaviour);
        expect(a.hash()).toBe(b.hash());
      }),
      { numRuns: 50 },
    );
  });

  it('Snapshot + Wiederherstellung setzt bitgleich fort', () => {
    fc.assert(
      fc.property(seedArb, behaviourArb, behaviourArb, (seed, first, second) => {
        const original = Simulation.create(busyConfig(seed));
        play(original, first);
        const restored = Simulation.restore(
          JSON.parse(JSON.stringify(original.snapshot())) as SimSnapshot,
        );
        expect(restored.hash()).toBe(original.hash());
        play(original, second);
        play(restored, second);
        expect(restored.hash()).toBe(original.hash());
      }),
      { numRuns: 30 },
    );
  });

  it('Replay aus dem Befehlsprotokoll ergibt denselben Zustand', () => {
    fc.assert(
      fc.property(seedArb, behaviourArb, (seed, behaviour) => {
        const sim = Simulation.create(busyConfig(seed));
        play(sim, behaviour);
        const replayed = replay(busyConfig(seed), sim.commandLog(), sim.tick);
        expect(replayed.hash()).toBe(sim.hash());
      }),
      { numRuns: 30 },
    );
  });

  it('Replay stimmt auch bei sofort angewendeten Befehlen (flush, z. B. in der Pause)', () => {
    fc.assert(
      fc.property(
        seedArb,
        fc.array(
          fc.constantFrom<'step' | 'accept' | 'bogus'>('step', 'step', 'step', 'accept', 'bogus'),
          {
            minLength: 50,
            maxLength: 400,
          },
        ),
        (seed, actions) => {
          const sim = Simulation.create(busyConfig(seed));
          for (const action of actions) {
            if (action === 'step') {
              sim.step();
              continue;
            }
            const oldest = sim.view().waitingCalls[0];
            sim.submit({
              type: 'call/accept',
              callId: action === 'accept' && oldest ? oldest.id : '?',
            });
            sim.flush();
          }
          const replayed = replay(busyConfig(seed), sim.commandLog(), sim.tick);
          expect(replayed.hash()).toBe(sim.hash());
        },
      ),
      { numRuns: 30 },
    );
  });

  it('flush wendet Befehle an, ohne Spielzeit zu verbrauchen', () => {
    const sim = Simulation.create(busyConfig(3));
    while (sim.view().waitingCalls.length === 0) sim.step();
    const { time, tick } = sim;
    const id = sim.view().waitingCalls[0]!.id;
    sim.submit({ type: 'call/accept', callId: id });
    const events = sim.flush();
    expect(events).toEqual([{ type: 'call/accepted', at: time, callId: id, waitedMs: 0 }]);
    expect(sim.time).toBe(time);
    expect(sim.tick).toBe(tick);
  });

  it('Golden-Replay: fester Seed ergibt festen Hash', () => {
    // Nur bewusst aktualisieren: `test(sim): update golden replays – <Grund>` (CLAUDE.md).
    const sim = Simulation.create(busyConfig(112));
    play(
      sim,
      Array.from({ length: 3600 }, (_, i) => (i % 17 === 0 ? 'accept' : 'none')),
    );
    expect({ tick: sim.tick, hash: sim.hash(), stats: sim.view().stats }).toMatchInlineSnapshot(`
      {
        "hash": "fa4fe68d45e7f27e",
        "stats": {
          "callsAbandoned": 4,
          "callsAccepted": 154,
          "callsReceived": 159,
          "totalWaitMs": 3676000,
        },
        "tick": 3600,
      }
    `);
  });
});

describe('Simulation – Invarianten', () => {
  it('Zeit läuft je Tick um genau TICK_MS vorwärts', () => {
    fc.assert(
      fc.property(seedArb, behaviourArb, (seed, behaviour) => {
        const sim = Simulation.create(busyConfig(seed));
        let last = sim.time;
        for (const action of behaviour) {
          if (action === 'bogus') sim.submit({ type: 'call/accept', callId: '?' });
          sim.step();
          expect(sim.time - last).toBe(TICK_MS);
          last = sim.time;
        }
      }),
      { numRuns: 30 },
    );
  });

  it('kein Notruf geht verloren: eingegangen = wartend + angenommen + aufgelegt', () => {
    fc.assert(
      fc.property(seedArb, behaviourArb, (seed, behaviour) => {
        const sim = Simulation.create(busyConfig(seed));
        play(sim, behaviour);
        const { stats, waitingCalls } = sim.view();
        expect(stats.callsReceived).toBe(
          waitingCalls.length + stats.callsAccepted + stats.callsAbandoned,
        );
        expect(new Set(waitingCalls.map((c) => c.id)).size).toBe(waitingCalls.length);
      }),
      { numRuns: 50 },
    );
  });

  it('ein Anruf kann nur einmal angenommen werden', () => {
    const sim = Simulation.create(busyConfig(3));
    while (sim.view().waitingCalls.length === 0) sim.step();
    const id = (sim.view().waitingCalls[0] as { id: string }).id;
    const cmd: SimCommand = { type: 'call/accept', callId: id };
    sim.submit(cmd);
    sim.submit(cmd);
    const events = sim.step();
    expect(events.filter((e) => e.type === 'call/accepted')).toHaveLength(1);
    expect(events.filter((e) => e.type === 'command/rejected')).toHaveLength(1);
  });

  it('wartende Anrufer legen innerhalb der konfigurierten Geduld auf', () => {
    const config = busyConfig(9);
    const sim = Simulation.create(config);
    const received = new Map<string, number>();
    const events = sim.run(1800);
    for (const e of events) {
      if (e.type === 'call/incoming') received.set(e.callId, e.at);
      if (e.type === 'call/abandoned') {
        const waited = (e.at - (received.get(e.callId) ?? NaN)) / 1000;
        expect(waited).toBeGreaterThanOrEqual(config.abandonAfterSeconds[0]);
        expect(waited).toBeLessThanOrEqual(config.abandonAfterSeconds[1]);
      }
    }
    expect(events.some((e) => e.type === 'call/abandoned')).toBe(true);
  });
});

describe('Simulation – Statistik', () => {
  it('trifft die mittlere Anrufrate (± 10 %)', () => {
    const rate = 30;
    const flat = new Array<number>(24).fill(1);
    const sim = Simulation.create(
      defaultConfig({ seed: 5, startTime: START, callRatePerHour: rate, hourlyProfile: flat }),
    );
    const hours = 50;
    sim.run((hours * MS_PER_HOUR) / TICK_MS);
    const received = sim.view().stats.callsReceived;
    expect(Math.abs(received - rate * hours)).toBeLessThan(rate * hours * 0.1);
  });

  it('folgt dem Tagesprofil: nachts deutlich weniger Anrufe als vormittags', () => {
    const sim = Simulation.create(
      defaultConfig({ seed: 11, startTime: simTimeFrom(2026, 1, 1), callRatePerHour: 60 }),
    );
    let night = 0;
    let morning = 0;
    for (let day = 0; day < 10; day++) {
      for (let h = 0; h < 24; h++) {
        const events = sim.run(MS_PER_HOUR / TICK_MS);
        const n = events.filter((e) => e.type === 'call/incoming').length;
        if (h >= 2 && h < 5) night += n;
        if (h >= 9 && h < 12) morning += n;
      }
    }
    expect(morning).toBeGreaterThan(night * 2);
  });
});

describe('Simulation – Konfiguration', () => {
  it('lehnt ungültige Werte ab', () => {
    expect(() => Simulation.create(defaultConfig({ seed: -1 }))).toThrow(RangeError);
    expect(() => Simulation.create(defaultConfig({ hourlyProfile: [1, 2] }))).toThrow(RangeError);
    expect(() => Simulation.create(defaultConfig({ abandonAfterSeconds: [10, 5] }))).toThrow(
      RangeError,
    );
  });

  it('lehnt Snapshots unbekannter Version ab', () => {
    const snap = Simulation.create(defaultConfig()).snapshot();
    expect(() => Simulation.restore({ ...snap, version: 99 as 1 })).toThrow(RangeError);
  });
});
