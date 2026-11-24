# ADR-0001: ADRs zur Dokumentation von Entscheidungen

- Status: Angenommen
- Datum: 2026-11-24

## Kontext

Das Projekt ist langfristig angelegt; Entscheidungen müssen auch Monate später
nachvollziehbar sein, gerade wenn sie Realismus, Determinismus oder Datenformate betreffen.

## Entscheidung

Wir dokumentieren Architektur- und Produktentscheidungen als nummerierte Markdown-ADRs
in `docs/adr/` (Format: Kontext, Entscheidung, Alternativen, Konsequenzen). Neue ADRs
starten als „Vorgeschlagen" und werden mit Freigabe des Product Owners „Angenommen".

## Alternativen

- Entscheidungen nur im Plan oder in Commit-Messages: gehen verloren, schlecht durchsuchbar.
- Wiki außerhalb des Repos: nicht mit dem Code versioniert.

## Konsequenzen

Geringer Mehraufwand je Entscheidung; dafür klare Historie und weniger Grundsatzdiskussionen.
