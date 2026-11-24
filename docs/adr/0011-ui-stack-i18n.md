# ADR-0011: UI-Stack und Internationalisierung

- Status: Angenommen
- Datum: 2026-11-24

## Kontext

Professionelle, dichte Leitstellenoberfläche, dunkles Theme, vollständige Tastatursteuerung,
barrierearm, deutsch, aber i18n-fähig, 60 FPS bei vielen Objekten.

## Entscheidung

- **React** (aktuelle Hauptversion) + **Vite**.
- **State:** Zustand-Store je Fenster, gespeist aus Sim-Deltas; keine Spiellogik im UI.
- **Styling:** CSS Modules + Design-Tokens als CSS-Variablen (Farben, Abstände,
  Schriftgrößen, Statusfarben). Schriftgröße global skalierbar (rem-basiert).
- **Bausteine:** Radix-Primitives (zugängliche Dialoge, Menüs, Tabs), TanStack Virtual für
  lange Listen, eigene Komponenten für Leitstellen-Masken.
- **Tastatur:** eigener Shortcut-Manager mit Kontexten (Karte, Notrufmaske, Listen) und
  konfigurierbarer Belegung; jede Aktion ist per Tastatur erreichbar.
- **Barrierearmut:** WCAG-2.2-AA-Kontraste, Status nie nur über Farbe, sichtbarer Fokus.
- **i18n:** i18next + react-i18next, Namensräume je Bereich; die Sim liefert Schlüssel +
  Parameter. Deutsch ist Ausgangssprache.

## Alternativen

- Redux Toolkit: mehr Boilerplate, kein Mehrwert bei einem Delta-gespeisten Store.
- Tailwind: schnell, aber Design-Tokens und dichte Spezial-Layouts sind mit CSS Modules
  klarer.
- Komplette UI-Bibliothek (MUI o. ä.): wirkt generisch, schwer auf Leitstellen-Optik zu bringen.

## Konsequenzen

Mehr Eigenbau bei Komponenten, dafür eigenständige Optik und volle Kontrolle über Fokus
und Tastatur.
