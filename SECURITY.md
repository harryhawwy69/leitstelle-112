# Sicherheit

Leitstelle 112 läuft vollständig offline und sendet keine Daten. Trotzdem können
Sicherheitslücken entstehen, zum Beispiel beim Laden von Mods oder Spielständen aus fremden
Quellen.

## Unterstützte Versionen

Sicherheitskorrekturen gibt es für die jeweils neueste veröffentlichte Version.

## Lücke melden

Bitte **kein öffentliches Issue** anlegen. Nutze stattdessen
[„Report a vulnerability"](../../security/advisories/new) (GitHub Security Advisories) in diesem
Repository. Wir melden uns innerhalb von 7 Tagen.

Hilfreich sind: betroffene Version, Schritte zum Nachstellen, ggf. die präparierte Datei
(Mod, Spielstand, Regionspaket).

## Grundsätze

- Mods und Spielstände sind **Daten**, kein ausführbarer Code; sie werden vor dem Laden gegen
  Schemas validiert.
- Der Renderer läuft mit `contextIsolation`, `sandbox` und strikter Content-Security-Policy
  ohne Netzwerkzugriff.
