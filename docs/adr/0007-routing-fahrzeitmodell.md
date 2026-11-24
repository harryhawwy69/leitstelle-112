# ADR-0007: Eigenes Routing und Fahrzeitmodell

- Status: Angenommen
- Datum: 2026-11-24

## Kontext

Fahrzeugvorschläge müssen auf echter Fahrzeit beruhen. Fahrzeiten hängen von Straßentyp,
Tageszeit/Verkehr, Wetter und Sonderrechten ab. Routing ist Teil der deterministischen
Simulation und muss offline laufen.

## Entscheidung

- Eigenes Paket `packages/routing` in TypeScript, ohne native Abhängigkeiten.
- Graph im **CSR-Format** als Typed Arrays (vom Region-Builder erzeugt), inkl.
  Einbahnstraßen und einfacher Abbiegeverbote.
- **Kantenkosten** = Länge / v_basis(Klasse, Tempolimit) × f_verkehr(Klasse, Zeitband,
  Wochentag) × f_wetter(Zustand, Klasse) × f_sonderrechte(Klasse, Verkehr). Alle Faktoren
  sind Daten (YAML), nicht Code.
- **One-to-Many** (Dijkstra rückwärts vom Einsatzort) für Fahrzeugvorschläge;
  **A\*** für Einzelrouten; **Contraction Hierarchies** erst bei großen Regionen.
- Faktoren werden zum Abfahrtszeitpunkt ausgewertet (keine voll zeitabhängige Suche);
  Neuberechnung bei Statuswechsel oder Umleitung, nicht pro Tick.
- Kosten in ganzzahligen Millisekunden → deterministisch.

## Alternativen

- Eingebettete Engine (OSRM, Valhalla, GraphHopper): mächtig, aber native bzw. Java-Prozesse,
  schwer deterministisch in den Sim-Kern zu integrieren, eigene Datenformate, schwer modbar.
- Luftlinie × Faktor: unrealistisch (Flüsse, Autobahn), widerspricht der Anforderung.

## Konsequenzen

Volle Kontrolle und Testbarkeit (property-based: Dreiecksungleichung, Erreichbarkeit).
Eigener Aufwand für Graph-Aufbau und Optimierung bei großen Regionen.
