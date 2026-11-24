/**
 * Spielzeit und Kalender.
 *
 * Spielzeit ist eine ganze Zahl in Millisekunden seit 1970-01-01 00:00 *Ortszeit des
 * Leitstellenbereichs* (keine Zeitzone, keine Sommerzeitumstellung – Annahme für M1,
 * siehe docs/domain/zeit.md). Die Umrechnung in Kalenderfelder nutzt nur Ganzzahlarithmetik
 * (Algorithmus nach Howard Hinnant, "chrono-compatible low-level date algorithms"),
 * damit sie deterministisch ist und ohne `Date` auskommt.
 */

/** Spielzeit in ganzzahligen Millisekunden. */
export type SimTime = number;

/** Länge eines Simulationsticks: 1 Sekunde Spielzeit (ADR-0004). */
export const TICK_MS = 1000;

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Wochentag nach ISO 8601: 1 = Montag … 7 = Sonntag. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface CalendarTime {
  readonly year: number;
  /** 1–12 */
  readonly month: number;
  /** 1–31 */
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly weekday: IsoWeekday;
}

function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}

/** Tage seit 1970-01-01 für ein Datum des proleptischen gregorianischen Kalenders. */
export function daysFromCivil(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = floorDiv(y, 400);
  const yoe = y - era * 400;
  const mp = (month + 9) % 12;
  const doy = floorDiv(153 * mp + 2, 5) + day - 1;
  const doe = yoe * 365 + floorDiv(yoe, 4) - floorDiv(yoe, 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Umkehrung von {@link daysFromCivil}. */
export function civilFromDays(days: number): { year: number; month: number; day: number } {
  const z = days + 719468;
  const era = floorDiv(z, 146097);
  const doe = z - era * 146097;
  const yoe = floorDiv(
    doe - floorDiv(doe, 1460) + floorDiv(doe, 36524) - floorDiv(doe, 146096),
    365,
  );
  const doy = doe - (365 * yoe + floorDiv(yoe, 4) - floorDiv(yoe, 100));
  const mp = floorDiv(5 * doy + 2, 153);
  const day = doy - floorDiv(153 * mp + 2, 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  const year = yoe + era * 400 + (month <= 2 ? 1 : 0);
  return { year, month, day };
}

/** Erzeugt eine Spielzeit aus Kalenderfeldern (Ortszeit). */
export function simTimeFrom(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): SimTime {
  return (
    daysFromCivil(year, month, day) * MS_PER_DAY +
    hour * MS_PER_HOUR +
    minute * MS_PER_MINUTE +
    second * MS_PER_SECOND
  );
}

export function toCalendar(time: SimTime): CalendarTime {
  const days = floorDiv(time, MS_PER_DAY);
  const msOfDay = time - days * MS_PER_DAY;
  const { year, month, day } = civilFromDays(days);
  // 1970-01-01 war ein Donnerstag (ISO 4).
  const weekday = ((((days + 3) % 7) + 7) % 7) + 1;
  return {
    year,
    month,
    day,
    hour: floorDiv(msOfDay, MS_PER_HOUR),
    minute: floorDiv(msOfDay % MS_PER_HOUR, MS_PER_MINUTE),
    second: floorDiv(msOfDay % MS_PER_MINUTE, MS_PER_SECOND),
    weekday: weekday as IsoWeekday,
  };
}
