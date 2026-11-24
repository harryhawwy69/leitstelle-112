# ADR-0014: Endlosspiel und prozedurale Vielfalt

- Status: Angenommen
- Datum: 2026-11-24

## Kontext

Vorgabe des Product Owners: Einsätze und das ganze Spiel sollen realistisch sein und sich
**nicht durchspielen lassen**. Es soll immer wieder Neues passieren, damit es nicht langweilig
wird. Eine feste Liste von Einsätzen wäre nach wenigen Stunden bekannt.

## Entscheidung

Vielfalt entsteht aus **Kombination, verborgener Wahrheit und Weltdynamik**, nicht aus einer
langen Liste fertiger Einsätze. Alles bleibt deterministisch (Seed) und datengetrieben.

1. **Einsatzgenerator aus Bausteinen.** Ein Einsatz wird zusammengesetzt aus
   Meldebild-Vorlage × Patient(en) (Alter, Vorerkrankungen, Zustand, Verlauf) × Ort
   (Gebäudetyp, Stockwerk, Zugang, Aufzug, Hund, Hofeinfahrt) × Umstände (Uhrzeit, Wetter,
   Verkehr) × Anrufertyp × Komplikationen. Neue Bausteine vervielfachen die Kombinationen.
2. **Wahre Lage ≠ gemeldete Lage.** Jeder Einsatz hat eine verborgene *wahre Lage*. Der
   Anrufer meldet sie unvollständig, verzerrt oder falsch (Panik, Laie, Sprachbarriere,
   Dritter). Erst die Rückmeldung der Einsatzkräfte klärt sie auf → Nachalarmierung,
   Abbestellung, Umdisposition. Das ist der wichtigste Realismus- und Spannungsmotor.
3. **Lageentwicklung.** Einsätze verändern sich über die Zeit: Patient verschlechtert sich,
   Brand breitet sich aus, weitere Verletzte werden entdeckt, Folgeeinsätze entstehen
   (Unfall → Stau → Auffahrunfall).
4. **Ortsabhängige Wahrscheinlichkeiten.** Einsatzaufkommen folgt Bevölkerung und
   Örtlichkeiten der Region (Seniorenheime, Schulen, Industrie, Autobahn, Bahnhof, Freibad,
   Discos) sowie Tages-, Wochen- und Jahresmustern (Poisson-Prozesse mit zeitabhängiger Rate).
5. **Ereigniskalender und Weltlage.** Saisonale und zufällige Lagen: Glätte, Hitzewelle,
   Unwetter, Grippewelle, Volksfest, Fußballspiel, Silvester, Stromausfall, Baustellen und
   Straßensperrungen (verändern das Routing), Krankenhaus-Abmeldungen, Personalausfall,
   Fahrzeugdefekte.
6. **Seltene Großereignisse („Long Tail").** Sehr unwahrscheinliche, aber mögliche Lagen
   (Busunfall, Zugunglück, Gefahrgut, Großbrand, Evakuierung) sorgen dafür, dass auch nach
   hundert Stunden noch Überraschungen kommen.
7. **Wiederkehrende Personen.** Vielanrufer, Stammpatienten, bekannte Adressen – die Region
   „lebt" und hat ein Gedächtnis innerhalb eines Spielstands.
8. **Einsatz-Regie (Director).** Eine Regie-Komponente moduliert das Aufkommen *innerhalb
   realistischer Grenzen* (z. B. ± 25 % der Basisrate, Häufung nach Spannungskurve), damit
   Ruhephasen und Spitzen abwechseln. Sie erfindet nichts Unrealistisches. Schwierigkeitsgrade
   verschieben nur diese Grenzen und die Hilfestellung, nicht die Physik.
9. **Langzeitspiel ohne Ende.** Endlosbetrieb mit Kalender und Schichten; Laufbahn
   (Disponent → Schichtführer → Lagedienst), Übernahme größerer Bereiche, Bedarfsplanung
   (mit eigener Statistik neue Fahrzeuge/Wachen beantragen), Ereignis-Szenarien,
   Tages-Seed-Herausforderung (offline aus dem Datum abgeleitet).
10. **Community-Inhalte.** Regionen, Bausteine und Szenarien sind modbar (ADR-0009).

## Alternativen

- Handgeschriebene Einsatzliste: realistisch, aber schnell auswendig gelernt.
- Rein zufällige Einsätze ohne Struktur: abwechslungsreich, aber unglaubwürdig.

## Konsequenzen

- Das Datenmodell braucht ab dem Vertical Slice die Trennung *gemeldete* vs. *wahre* Lage
  (M3, einfache Form), damit spätere Ausbaustufen nicht umbauen müssen.
- Generator, Regie und Weltlage brauchen Statistik-Tests (Verteilungen, Raten) zusätzlich
  zu Determinismus-Tests.
- Inhaltspflege verlagert sich von „Einsätze schreiben" zu „Bausteine schreiben" – mehr
  Vielfalt je Zeile YAML.
