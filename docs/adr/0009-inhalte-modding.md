# ADR-0009: Datengetriebene Inhalte und Modding

- Status: Vorgeschlagen
- Datum: 2026-11-24

## Kontext

Einsatzarten, Fahrzeuge, Wachen, Krankenhäuser, Regionen, AAO, Hilfsfristen und
Fahrzeitfaktoren sollen ohne Codeänderung anpassbar sein.

## Entscheidung

- Inhalte als **YAML** (JSON ebenfalls akzeptiert) in `content/base/` und später in
  `%APPDATA%\Leitstelle112\mods\<mod>\`.
- **Zod-Schemas** in `packages/content-schema` sind die einzige Definition; TypeScript-Typen
  und **JSON-Schemas** (für Autovervollständigung im Editor der Modder) werden daraus erzeugt.
- **Validierung in zwei Stufen:** Schema je Datei, dann Querverweise (z. B. AAO verweist auf
  existierende Fahrzeugtypen, Wache liegt im Regionsgebiet). Fehlermeldungen mit Datei,
  Pfad und Zeile, auf Deutsch.
- **IDs** sind stabile Strings mit Namensraum (`base:rtw`, `meinmod:hlf20`).
- **Zusammenführung:** Mods in Ladereihenfolge; Überschreiben/Ergänzen explizit
  (`extends`, `replace`).
- Content-Validator als CLI und CI-Schritt.

## Alternativen

- JSON Schema als Quelle + Codegenerierung: weniger ergonomisch im TS-Code.
- Inhalte in TypeScript: nicht modbar ohne Build.

## Konsequenzen

Inhalte sind versionierbar und reviewbar. Schema-Änderungen brauchen eine
Content-Format-Version und ggf. Migrationshinweise für Modder.
