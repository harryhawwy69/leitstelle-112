import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { Rng, hashString32 } from './rng';

const seedArb = fc.integer({ min: 0, max: 0xffffffff });

describe('Rng', () => {
  it('liefert für denselben Seed dieselbe Folge', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const a = Rng.fromSeed(seed);
        const b = Rng.fromSeed(seed);
        for (let i = 0; i < 50; i++) {
          expect(a.nextUint32()).toBe(b.nextUint32());
        }
      }),
    );
  });

  it('ist bitgleich zur festgehaltenen Referenzfolge (Golden)', () => {
    // Ändert sich diese Folge, sind alle Spielstände und Replays ungültig.
    const rng = Rng.fromSeed(112);
    const values = Array.from({ length: 5 }, () => rng.nextUint32());
    expect(values).toMatchInlineSnapshot(`
      [
        3899740970,
        587042831,
        3825136874,
        3245970965,
        3077234349,
      ]
    `);
  });

  it('setzt nach Wiederherstellung des Zustands exakt fort', () => {
    fc.assert(
      fc.property(seedArb, fc.integer({ min: 0, max: 200 }), (seed, skip) => {
        const a = Rng.fromSeed(seed);
        for (let i = 0; i < skip; i++) a.nextUint32();
        const b = Rng.fromState(a.state());
        for (let i = 0; i < 20; i++) {
          expect(b.nextUint32()).toBe(a.nextUint32());
        }
      }),
    );
  });

  it('nextFloat liegt immer in [0, 1)', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const rng = Rng.fromSeed(seed);
        for (let i = 0; i < 100; i++) {
          const x = rng.nextFloat();
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThan(1);
        }
      }),
    );
  });

  it('nextInt bleibt im geschlossenen Intervall', () => {
    fc.assert(
      fc.property(
        seedArb,
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 0, max: 5000 }),
        (seed, min, width) => {
          const rng = Rng.fromSeed(seed);
          const max = min + width;
          for (let i = 0; i < 20; i++) {
            const x = rng.nextInt(min, max);
            expect(Number.isInteger(x)).toBe(true);
            expect(x).toBeGreaterThanOrEqual(min);
            expect(x).toBeLessThanOrEqual(max);
          }
        },
      ),
    );
  });

  it('nextInt ist annähernd gleichverteilt', () => {
    const rng = Rng.fromSeed(7);
    const counts = new Array<number>(10).fill(0);
    const n = 100_000;
    for (let i = 0; i < n; i++) {
      const k = rng.nextInt(0, 9);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    for (const c of counts) {
      expect(Math.abs(c - n / 10)).toBeLessThan((n / 10) * 0.05);
    }
  });

  it('Streams sind unabhängig von der Erzeugungsreihenfolge', () => {
    const a1 = Rng.stream(42, 'calls');
    Rng.stream(42, 'weather');
    const a2 = Rng.stream(42, 'calls');
    expect(a1.nextUint32()).toBe(a2.nextUint32());
    expect(Rng.stream(42, 'calls').nextUint32()).not.toBe(Rng.stream(42, 'weather').nextUint32());
  });

  it('lehnt ungültige Intervalle ab', () => {
    const rng = Rng.fromSeed(1);
    expect(() => rng.nextInt(5, 4)).toThrow(RangeError);
    expect(() => rng.nextInt(0.5, 4)).toThrow(RangeError);
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it('hashString32 ist stabil', () => {
    expect(hashString32('')).toBe(0x811c9dc5);
    expect(hashString32('calls')).toBe(hashString32('calls'));
    expect(hashString32('calls')).not.toBe(hashString32('callers'));
  });
});
