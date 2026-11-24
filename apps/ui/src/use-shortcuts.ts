import { useEffect } from 'react';
import { SPEEDS } from '@ls112/protocol';
import { useSim } from './sim-store';

/**
 * Globale Tastenkürzel (M1). Ab M3 übernimmt ein Shortcut-Manager mit Kontexten und
 * konfigurierbarer Belegung (ADR-0011).
 */
export function useGlobalShortcuts(): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      const sim = useSim.getState();
      if (event.code === 'Pause' || (event.code === 'Space' && !event.repeat)) {
        event.preventDefault();
        sim.togglePause();
        return;
      }
      if (event.key === 'F2') {
        event.preventDefault();
        sim.acceptOldestCall();
        return;
      }
      const digit = Number(event.key);
      if (!event.ctrlKey && !event.altKey && digit >= 1 && digit <= SPEEDS.length) {
        const speed = SPEEDS[digit - 1];
        if (speed !== undefined) sim.setSpeed(speed);
      }
    };
    // Leertaste ist global „Pause" – ein fokussierter Button darf sie nicht zusätzlich auslösen
    // (Buttons reagieren auf keyup).
    const swallowSpace = (event: KeyboardEvent) => {
      if (event.code === 'Space' && event.target instanceof HTMLButtonElement)
        event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', swallowSpace);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', swallowSpace);
    };
  }, []);
}
