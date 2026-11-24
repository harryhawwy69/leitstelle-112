import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MS_PER_DAY, civilFromDays, daysFromCivil, simTimeFrom, toCalendar } from './time';

describe('Kalender', () => {
  it('1970-01-01 ist Tag 0 und ein Donnerstag', () => {
    expect(daysFromCivil(1970, 1, 1)).toBe(0);
    expect(toCalendar(0).weekday).toBe(4);
  });

  it('kennt bekannte Daten', () => {
    // 24.11.2026 ist ein Dienstag.
    const t = simTimeFrom(2026, 11, 24, 7, 45, 30);
    expect(toCalendar(t)).toEqual({
      year: 2026,
      month: 11,
      day: 24,
      hour: 7,
      minute: 45,
      second: 30,
      weekday: 2,
    });
    // Schaltjahr
    expect(civilFromDays(daysFromCivil(2028, 2, 29))).toEqual({ year: 2028, month: 2, day: 29 });
    expect(daysFromCivil(2028, 3, 1) - daysFromCivil(2028, 2, 28)).toBe(2);
    expect(daysFromCivil(2100, 3, 1) - daysFromCivil(2100, 2, 28)).toBe(1);
  });

  it('daysFromCivil und civilFromDays sind invers', () => {
    fc.assert(
      fc.property(fc.integer({ min: -200_000, max: 200_000 }), (days) => {
        const { year, month, day } = civilFromDays(days);
        expect(daysFromCivil(year, month, day)).toBe(days);
      }),
    );
  });

  it('Wochentag rückt jeden Tag um eins weiter', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100_000, max: 100_000 }), (days) => {
        const a = toCalendar(days * MS_PER_DAY).weekday;
        const b = toCalendar((days + 1) * MS_PER_DAY).weekday;
        expect(b).toBe((a % 7) + 1);
      }),
    );
  });
});
