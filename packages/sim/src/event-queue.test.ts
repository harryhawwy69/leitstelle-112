import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { EventQueue } from './event-queue';

describe('EventQueue', () => {
  it('liefert Ereignisse sortiert nach Zeit, bei Gleichstand nach Einfügereihenfolge', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 50 }), { maxLength: 200 }), (times) => {
        const q = new EventQueue<number>();
        times.forEach((t, i) => q.schedule(t, i));
        const out: { at: number; payload: number }[] = [];
        for (let e = q.popDue(Infinity); e; e = q.popDue(Infinity)) {
          out.push({ at: e.at, payload: e.payload });
        }
        const expected = times
          .map((t, i) => ({ at: t, payload: i }))
          .sort((a, b) => a.at - b.at || a.payload - b.payload);
        expect(out).toEqual(expected);
      }),
    );
  });

  it('gibt nur fällige Ereignisse heraus', () => {
    const q = new EventQueue<string>();
    q.schedule(10, 'a');
    q.schedule(20, 'b');
    expect(q.popDue(5)).toBeUndefined();
    expect(q.popDue(10)?.payload).toBe('a');
    expect(q.popDue(15)).toBeUndefined();
    expect(q.size).toBe(1);
  });

  it('übersteht einen JSON-Roundtrip ohne Änderung der Reihenfolge', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 20 }), { maxLength: 100 }), (times) => {
        const q = new EventQueue<number>();
        times.forEach((t, i) => q.schedule(t, i));
        const copy = EventQueue.fromJSON<number>(
          JSON.parse(JSON.stringify(q.toJSON())) as ReturnType<typeof q.toJSON>,
        );
        copy.schedule(5, -1);
        q.schedule(5, -1);
        const drain = (x: EventQueue<number>) => {
          const r: number[] = [];
          for (let e = x.popDue(Infinity); e; e = x.popDue(Infinity)) r.push(e.payload);
          return r;
        };
        expect(drain(copy)).toEqual(drain(q));
      }),
    );
  });
});
