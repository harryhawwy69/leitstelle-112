# ADR-0002: Electron als Desktop-Shell

- Status: Vorgeschlagen
- Datum: 2026-11-24

## Kontext

Gefordert: Windows 10/11 x64, offline, React-UI, MapLibre-Karte, SQLite, Mehrfenster und
Mehrmonitor, Simulationskern in TypeScript strikt vom UI getrennt, E2E-Tests mit Playwright,
Start < 5 s, Installer (MSI/NSIS). Zur Wahl standen Tauri 2 und Electron.

## Entscheidung

Wir verwenden **Electron** mit **electron-builder** (NSIS-Installer).

Ausschlaggebend:

1. **Ein Simulationskern für viele Fenster.** Der TS-Kern läuft in einem eigenen
   Node-Prozess (`utilityProcess`) und versorgt alle Fenster über MessagePorts (ADR-0005).
   In Tauri müsste der Kern entweder in Rust neu geschrieben werden (zweite Sprache,
   widerspricht der TypeScript-Vorgabe) oder in einem versteckten WebView laufen, das Daten
   per Event-Bus an die anderen WebViews weiterreicht – umständlich und langsamer.
2. **Playwright unterstützt Electron direkt** (`_electron.launch`). Für Tauri gibt es nur
   WebDriver über `tauri-driver`, mit weniger Möglichkeiten (Tracing, Mehrfenster).
3. **Eine Sprache, eine Toolchain.** Kein Rust/MSVC nötig; auf dem Entwicklungsrechner ist
   weder Rust noch Node installiert, Node allein ist schneller aufgesetzt.
4. **Einheitliche Rendering-Engine.** Electron bringt eine feste Chromium-Version mit;
   WebGL-/MapLibre-Verhalten ist auf jedem Rechner gleich (Tauri nutzt das jeweils
   installierte WebView2).
5. **Reife Mehrmonitor-APIs** (`screen`, Fensterpositionen, DPI-Wechsel).

## Alternativen

- **Tauri 2:** kleinerer Installer (~10 MB statt ~100 MB), weniger RAM, gutes
  Sicherheitsmodell, SQLite per Plugin. Hauptproblem ist der geteilte Sim-Zustand über
  mehrere Fenster bei einem TS-Kern, dazu schwächere E2E-Unterstützung.
- **Browser + lokaler Server:** kein echtes Mehrfenster-Management, kein Installer-Erlebnis.

## Konsequenzen

- Installer ~90–120 MB, RAM-Bedarf ~300–500 MB. Für ein Desktop-Spiel vertretbar.
- Electron-Sicherheitsrichtlinien sind Pflicht: `contextIsolation`, `sandbox`,
  kein `nodeIntegration` im Renderer, strikte CSP, keine Remote-Inhalte.
- Native Module (better-sqlite3) müssen für die Electron-ABI gebaut werden (CI-Schritt).
- Ein späterer Wechsel zu Tauri bleibt teuer, weil Sim-Host-Prozess und IPC
  Electron-spezifisch sind; der Sim-Kern selbst bleibt portabel.
