# Mitmachen bei Leitstelle 112

Schön, dass du helfen willst! Beiträge sind willkommen – Code, Inhalte, Tests und vor allem
**fachliches Feedback** von Menschen aus Leitstelle, Rettungsdienst und Feuerwehr.

## Wege, beizutragen

- **Fehler melden:** Issue mit der Vorlage „Fehlerbericht". Hänge, wenn möglich, das
  Diagnosepaket an (Menü *Hilfe → Diagnosepaket erstellen*) – es enthält Seed und Eingaben,
  damit wir den Fehler exakt nachstellen können.
- **Realismus-Feedback:** Vorlage „Fachliches Feedback". Bitte mit Quelle oder Erfahrungswert.
- **Ideen:** Vorlage „Feature-Wunsch".
- **Code oder Inhalte:** Pull Request (siehe unten).

## Entwicklungsumgebung

```powershell
pnpm install       # Abhängigkeiten
pnpm dev           # App im Entwicklungsmodus
pnpm lint          # ESLint
pnpm typecheck     # TypeScript
pnpm test          # Vitest (Unit + property-based)
pnpm e2e           # Playwright gegen die gebaute App
pnpm package       # Windows-Installer bauen
```

## Regeln, die wir ernst nehmen

1. **Nichts von anderen Spielen oder kommerzieller Leitstellensoftware übernehmen** – kein
   Code, keine Grafiken, Texte, Daten oder Namen.
2. **Nur eigene oder frei lizenzierte Assets.** Neue Fremdquellen kommen vorher in
   [`docs/LICENSES.md`](docs/LICENSES.md).
3. **Der Simulationskern bleibt deterministisch** – kein `Math.random`, kein `Date`, keine
   Timer in `packages/sim` und `packages/routing`.
4. Alle Konventionen stehen in [`CLAUDE.md`](CLAUDE.md), Architekturentscheidungen in
   [`docs/adr/`](docs/adr/README.md).

## Ablauf für Pull Requests

1. Issue suchen oder anlegen und kurz ankündigen, dass du daran arbeitest.
2. Branch von `main`: `feat/kurzbeschreibung`, `fix/kurzbeschreibung`.
3. Kleine, fokussierte Commits nach [Conventional Commits](https://www.conventionalcommits.org/de/):
   `feat(sim): Nachalarmierung ergänzen`.
4. Tests schreiben; `pnpm lint && pnpm typecheck && pnpm test` muss grün sein.
5. `CHANGELOG.md` unter „Unreleased" ergänzen.
6. PR mit der Vorlage öffnen und das Issue verlinken (`Closes #123`).

## Lizenz deiner Beiträge

Mit einem Beitrag stimmst du zu, dass Code unter
[GPL-3.0-or-later](LICENSE) und Inhalte unter [CC BY-SA 4.0](content/LICENSE.md) veröffentlicht
werden.

## Verhalten

Es gilt unser [Verhaltenskodex](CODE_OF_CONDUCT.md).
