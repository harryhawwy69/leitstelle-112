# ADR-0005: Prozessarchitektur – Sim-Host und Fenster

- Status: Vorgeschlagen
- Datum: 2026-11-24

## Kontext

Mehrere Fenster (Karte, Einsatzliste, Fahrzeugstatus, Notrufmaske, Funk) auf mehreren
Monitoren zeigen denselben Simulationszustand. Die UI muss 60 FPS halten, unabhängig von
Simulationslast und Speichervorgängen.

## Entscheidung

- **Main-Prozess:** nur Fenster, Menüs, Lifecycle, Logging-Sammelstelle, Crash-Handler.
- **Sim-Host:** eigener Electron-`utilityProcess` (Node). Hält Sim-Kern, Inhalte,
  Regionsgraph und SQLite-Persistenz. Ein Absturz reißt die Fenster nicht mit; der Main
  schreibt einen Crash-Report und bietet das Laden des letzten Autosaves an.
- **Renderer:** je Fenster eine Instanz derselben React-App mit Ansicht-Parameter. Jedes
  Fenster erhält vom Main einen **MessagePort direkt zum Sim-Host** (kein Umweg über Main).
- **Protokoll** (`packages/protocol`): Befehle (UI → Sim), Deltas + Ereignisse (Sim → UI),
  Abfragen mit Antwort (z. B. Fahrzeugvorschlag). Deltas gebündelt mit bis zu 10 Hz;
  Bewegung als Route + Fortschritt, Interpolation im Renderer.
- Preload stellt nur eine minimale, typisierte API bereit (`contextBridge`).

## Alternativen

- Sim im Main-Prozess: blockiert Fensterverwaltung bei Last oder beim Speichern.
- Sim in `worker_threads` des Main: kein Absturzschutz.
- Sim im Renderer (Web Worker): funktioniert nur für ein Fenster.

## Konsequenzen

Klare Trennung, gute Robustheit. Serialisierungskosten der Deltas müssen gemessen werden
(Budget in M4). Kein gemeinsamer Speicher – bewusst.
