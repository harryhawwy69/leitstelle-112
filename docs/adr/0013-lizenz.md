# ADR-0013: Lizenz – GPL-3.0 für Code, CC BY-SA 4.0 für Inhalte

- Status: Angenommen
- Datum: 2026-11-24

## Kontext

Das Repository ist öffentlich auf GitHub. Der Product Owner möchte kein Geld ausgeben, das
Projekt soll professionell wirken und die Lizenzwahl wurde an das Entwicklungsteam delegiert.
Ziel: Das Spiel bleibt frei, niemand soll es als geschlossenes Produkt weiterverkaufen können,
Modder sollen Inhalte teilen dürfen.

## Entscheidung

- **Quellcode:** GNU General Public License v3.0 oder später (`GPL-3.0-or-later`),
  Datei `LICENSE` im Wurzelverzeichnis.
- **Inhalte** (`content/`, Regionspakete, eigene Grafiken, Icons, Texte, Kartenstil):
  Creative Commons BY-SA 4.0 (`content/LICENSE.md`).
- **Fremddaten** behalten ihre Lizenz (z. B. OSM: ODbL) und werden getrennt ausgewiesen.
- Abhängigkeiten müssen GPL-3.0-kompatibel sein (MIT, BSD, ISC, Apache-2.0, OFL für
  Schriften sind es). Das prüft ein Lizenz-Check in der CI.
- Beiträge erfolgen unter derselben Lizenz (Hinweis in `CONTRIBUTING.md`, kein CLA).

## Alternativen

- **MIT:** maximal einfach, aber jeder könnte eine geschlossene, kommerzielle Kopie bauen.
- **AGPL:** schützt auch gegen Server-Betrieb – für ein Offline-Desktopspiel unnötig.
- **Proprietär/ohne Lizenz:** in einem öffentlichen Repo unüblich, schreckt Mitwirkende ab.

## Konsequenzen

Forks müssen offen bleiben. Ein späterer kommerzieller Vertrieb (z. B. Steam) ist mit GPL
möglich, solange der Quellcode verfügbar bleibt. Ein Lizenzwechsel wird nach externen
Beiträgen schwierig – bewusst akzeptiert.
