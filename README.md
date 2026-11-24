<div align="center">

# 🚑 Leitstelle 112

**Realistischer Leitstellensimulator für Rettungsdienst, Feuerwehr und Katastrophenschutz –
offline, für Windows.**

[![CI](https://github.com/samuelklsn/leitstelle-112/actions/workflows/ci.yml/badge.svg)](https://github.com/samuelklsn/leitstelle-112/actions/workflows/ci.yml)
[![Lizenz: GPL-3.0](https://img.shields.io/badge/Code-GPL--3.0-blue.svg)](LICENSE)
[![Inhalte: CC BY-SA 4.0](https://img.shields.io/badge/Inhalte-CC%20BY--SA%204.0-lightgrey.svg)](content/LICENSE.md)
![Plattform](https://img.shields.io/badge/Plattform-Windows%2010%2F11-0078D6)
![Status](https://img.shields.io/badge/Status-in%20Entwicklung-orange)

[Plan](docs/PLAN.md) · [Roadmap](https://github.com/samuelklsn/leitstelle-112/milestones) ·
[Architektur](docs/adr/README.md) · [Mitmachen](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

</div>

---

## Worum geht es?

Du sitzt als Disponentin oder Disponent in einer Integrierten Leitstelle. Das Telefon klingelt:
Eine Nachbarin meldet einen „Sturz", panisch und ohne Hausnummer. Du fragst ab, findest die
Adresse, alarmierst den nächsten RTW nach **echter Fahrzeit**. Vor Ort stellt sich heraus: Es ist
eine Reanimation. Jetzt zählt jede Sekunde: NEF nachalarmieren, Zielklinik mit Herzkatheter
wählen und gleichzeitig den Wohnungsbrand annehmen, der auf Leitung 2 wartet.

## Was dieses Spiel ausmacht

- **Realistische Abläufe:** Notrufabfrage, Alarm- und Ausrückeordnung, FMS-Status, Funkverkehr,
  Übergabezeiten, Bettenkapazitäten, Hilfsfristen nach Bundesland.
- **Echte Fahrzeiten:** lokales Routing auf dem Straßennetz, abhängig von Straßentyp, Tageszeit,
  Verkehr, Wetter und Sonderrechten.
- **Nie durchgespielt:** Einsätze werden aus Bausteinen zusammengesetzt, die gemeldete Lage ist
  nicht immer die wahre Lage, Einsätze entwickeln sich, die Welt hat Jahreszeiten, Großlagen und
  ein Gedächtnis ([ADR-0014](docs/adr/0014-endlosspiel-prozedurale-vielfalt.md)).
- **Einsatzleitrechner-Feeling:** dunkle, dichte Oberfläche, vollständige Tastatursteuerung,
  mehrere Fenster und Monitore.
- **Komplett offline:** keine Accounts, keine Telemetrie, keine Server.
- **Modbar:** Fahrzeuge, Einsatzarten, Wachen, Krankenhäuser und ganze Regionen als YAML-Dateien.

## Status

🚧 **Frühe Entwicklung.** Der erste spielbare Stand (Vertical Slice, v0.1) umfasst den fiktiven
Landkreis Brakenfeld mit drei Rettungswachen, einem Notarztstandort und zwei Krankenhäusern.
Fortschritt: [Meilensteine](https://github.com/samuelklsn/leitstelle-112/milestones).

| Meilenstein                | Inhalt                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| M1 Fundament               | Monorepo, CI, Electron-Shell, Simulationskern mit Zeitraffer                                                  |
| M2 Welt & Routing          | fiktiver Landkreis, Straßengraph, Offline-Karte                                                               |
| M3 Vertical Slice – Ablauf | Notruf → Disposition → Anfahrt → Transport → Krankenhaus                                                      |
| M4 Vertical Slice – fertig | Speichern, Auswertung, Tutorial, **v0.1.0**                                                                   |
| M5 – M12                   | Notrufannahme 2.0, Feuerwehr, Logistik, Welt-Dynamik, Mehrmonitor, MANV, Langzeitspiel, Editoren (**v1.0.0**) |

## Technik

Electron · TypeScript (strict) · React · MapLibre GL · SQLite · Vitest · fast-check · Playwright

Der Simulationskern ist ein eigenes, deterministisches Paket ohne UI-Abhängigkeit: gleicher
Seed und gleiche Eingaben ergeben immer denselben Verlauf. Details:
[Architektur-Entscheidungen](docs/adr/README.md).

## Entwickeln

Voraussetzungen: Windows 10/11 x64, Node.js LTS, pnpm 10.

```powershell
pnpm install
pnpm dev
```

Weitere Befehle und Konventionen: [CONTRIBUTING.md](CONTRIBUTING.md).

## Lizenz

- Code: [GPL-3.0-or-later](LICENSE)
- Inhalte (Daten, Grafiken, Texte): [CC BY-SA 4.0](content/LICENSE.md)
- Fremdkomponenten: [docs/LICENSES.md](docs/LICENSES.md)

> **Hinweis:** Leitstelle 112 ist ein Spiel. Es ist kein Schulungswerkzeug mit fachlicher
> Verbindlichkeit für den realen Leitstellen- oder Rettungsdienstbetrieb. Alle Orte, Personen und
> Einrichtungen im Landkreis Brakenfeld sind frei erfunden.
