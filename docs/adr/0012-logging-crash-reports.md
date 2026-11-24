# ADR-0012: Logging und Crash-Reports

- Status: Angenommen
- Datum: 2026-11-24

## Kontext

Strukturiertes Logging und Crash-Reports in lokale Dateien; keine Daten verlassen den Rechner.

## Entscheidung

- **pino** in Main und Sim-Host; Renderer loggen über die Preload-API zum Main.
  JSON-Lines unter `%APPDATA%\Leitstelle112\logs\`, Rotation nach Größe/Tag, 14 Tage
  Aufbewahrung. Felder: Zeit, Prozess, Modul, Level, Spielzeit, Nachricht, Kontext.
- **Native Abstürze:** Electron-`crashReporter` mit `uploadToServer: false` (Minidumps lokal).
- **JS-Fehler:** globale Handler in allen Prozessen schreiben einen JSON-Crash-Report
  (App-/Content-Version, OS, Seed, letzte 200 Befehle, letzte Log-Zeilen) nach
  `…\crashes\`. Nach einem Absturz des Sim-Hosts bietet die App das Laden des letzten
  Autosaves an.
- Menüpunkt „Diagnosepaket erstellen" bündelt Logs + Crash-Reports als ZIP für Bugreports.

## Alternativen

- electron-log: einfacher, aber weniger strukturiert.
- Sentry o. ä.: verletzt die Offline- und Datenschutzanforderung.

## Konsequenzen

Bugs sind dank Seed + Befehlsprotokoll meist reproduzierbar. Ohne Telemetrie erfahren wir
von Fehlern nur über aktive Bugreports.
