import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseClientMessage } from './index';

describe('parseClientMessage', () => {
  it('akzeptiert gültige Nachrichten', () => {
    expect(parseClientMessage({ type: 'clock/setSpeed', speed: 5 })).toEqual({
      type: 'clock/setSpeed',
      speed: 5,
    });
    expect(parseClientMessage({ type: 'clock/setPaused', paused: true })).toEqual({
      type: 'clock/setPaused',
      paused: true,
    });
    expect(
      parseClientMessage({ type: 'sim/command', command: { type: 'call/accept', callId: 'N1' } }),
    ).toEqual({ type: 'sim/command', command: { type: 'call/accept', callId: 'N1' } });
  });

  it('lehnt ungültige Zeitraffer-Stufen und unbekannte Befehle ab', () => {
    expect(parseClientMessage({ type: 'clock/setSpeed', speed: 3 })).toBeUndefined();
    expect(parseClientMessage({ type: 'sim/command', command: { type: 'x' } })).toBeUndefined();
    expect(parseClientMessage({ type: 'clock/setPaused', paused: 'ja' })).toBeUndefined();
  });

  it('übersteht beliebige Eingaben ohne Ausnahme und kopiert keine Fremdfelder', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const parsed = parseClientMessage(input);
        if (parsed) {
          expect(
            Object.keys(parsed).every((k) =>
              ['type', 'speed', 'paused', 'command', 'protocol', 'view'].includes(k),
            ),
          ).toBe(true);
        }
      }),
    );
  });
});
