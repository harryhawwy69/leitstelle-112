# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.
Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

## [0.0.1] – 2026-11-24 – Meilenstein M1 „Fundament"

Erster lauffähiger Stand: Die App startet, die Simulation läuft im eigenen Prozess mit Pause
und Zeitraffer, Notrufe gehen ein und können angenommen werden. Noch kein Spielinhalt im
eigentlichen Sinn – das kommt ab M2/M3.

### Hinzugefügt

- **Simulationskern** (`packages/sim`): deterministischer PRNG (xoshiro128\*\*) mit
  unabhängigen Streams je Subsystem, ganzzahlige Spielzeit mit Kalender ohne `Date`,
  Ereigniswarteschlange, Befehle mit Protokoll und Replay, State-Hash, Snapshots.
- **Notrufgenerator** mit realistischem Tagesprofil (nachts weniger, vormittags mehr) und
  Anrufern, die nach 45–180 s Wartezeit auflegen.
- **Protokoll** (`packages/protocol`) zwischen Sim-Host und Fenstern mit Validierung aller
  eingehenden Nachrichten.
- **Desktop-App** (`apps/desktop`): Electron mit Sim-Host im eigenen Prozess, Sandbox, CSP,
  eigenes `app://`-Protokoll, JSON-Lines-Logging, lokale Crash-Reports, automatischer Neustart
  der Simulation nach Absturz, NSIS-Installer-Konfiguration.
- **Oberfläche** (`apps/ui`): dunkles Einsatzleitrechner-Theme, Spieluhr, Pause und
  Zeitraffer 1×/2×/5×/10×, Notrufliste mit Wartezeit-Eskalation, Ereignisprotokoll,
  FMS-Legende, Tastatur (Leertaste, 1–4, F2), deutsche Texte über i18n.
- **Qualität:** 47 Unit- und Property-Tests (Coverage Sim-Kern 96 %), 5 E2E-Tests mit
  Playwright, CI auf `windows-latest` mit Installer-Artefakt, Dependabot.
- **Projekt:** Plan, 14 ADRs, Konventionen, Lizenz (GPL-3.0 / CC BY-SA 4.0), Community-Dateien,
  Issue- und PR-Vorlagen, Konzept für Endlosspiel und prozedurale Vielfalt (ADR-0014).

### Bekannte Einschränkungen

- Spielzeit ohne Sommerzeitumstellung (Annahme, siehe `packages/sim/src/time.ts`).
- Nach einem Absturz startet die Simulation neu beim Schichtbeginn; Autosave folgt in M4.
- Der Installer wird nur in der CI gebaut (Richtlinie des Entwicklungsrechners, PLAN Kapitel 9).

[Unreleased]: https://github.com/samuelklsn/leitstelle-112/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/samuelklsn/leitstelle-112/releases/tag/v0.0.1
