# ADR-0010: Teststrategie

- Status: Vorgeschlagen
- Datum: 2026-11-24

## Kontext

Vorgaben: Vitest, property-based Tests für die Simulation, Playwright-E2E, CI auf
`windows-latest`, Performance-Ziele (60 FPS, 300 Fahrzeuge, 100 Einsätze, Start < 5 s).

## Entscheidung

- **Unit:** Vitest in allen Paketen, Tests neben dem Code (`*.test.ts`).
- **Property-based:** fast-check für Sim-Invarianten, Routing, Serialisierungs-Roundtrips.
  Gefundene Gegenbeispiele werden als Regressionstest festgehalten.
- **Determinismus/Golden-Replays:** gespeicherte Szenarien (Seed + Befehle) mit erwartetem
  State-Hash. Änderungen am Hash werden bewusst in einem eigenen Commit aktualisiert.
- **E2E:** Playwright mit `_electron` gegen den gebauten App-Stand; Kernabläufe des
  Vertical Slice.
- **Performance:** `vitest bench` für Tick-Kosten (Budget < 5 ms je Tick bei 300 Fz/100
  Einsätzen), Startzeit und FPS-Messung im E2E-Lauf. Gerissene Budgets lassen die CI fehlschlagen.
- **Coverage:** Ziel ≥ 85 % für `packages/sim` und `packages/routing`; UI ohne festes Ziel.
- **CI:** GitHub Actions auf `windows-latest`: install → lint → typecheck → test →
  content-validate → build → e2e → package (NSIS-Installer als Artefakt).

## Alternativen

- Jest: langsamer, schwächere ESM-Unterstützung.
- Nur manuelle UI-Tests: zu fehleranfällig bei Tastatursteuerung.

## Konsequenzen

Etwas längere CI-Läufe (Windows-Runner), dafür hohe Sicherheit bei Refactorings im Sim-Kern.
