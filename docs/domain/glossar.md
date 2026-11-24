# Glossar der Fachbegriffe

Kurze Erklärungen für Begriffe, die im Spiel und im Code auftauchen. Die
Code-Bezeichner sind die Namen, die in Daten, Zuständen und der Oberfläche
verwendet werden.

| Begriff | Erklärung | Code-Bezeichner |
| --- | --- | --- |
| **AAO** | Alarm- und Ausrückeordnung: legt fest, welche Fahrzeuge zu einem Einsatzstichwort fahren. Im Spiel schlägt sie eine Fahrzeugfolge vor, die Disposition kann sie überstimmen. | `aao` |
| **FMS** | Funkmeldesystem: die Statusmeldungen, die ein Fahrzeug über Funk gibt. Der Status beschreibt, ob ein Fahrzeug verfügbar ist, am Einsatzort steht oder einen Patienten transportiert. | `fms`, `FMS_LEGEND` in `apps/ui/src/App.tsx` |
| **Hilfsfrist** | Zeit vom Notrufeingang bis zum Eintreffen des ersten Rettungsmittels am Einsatzort. Die Vorgabe hängt vom Bundesland ab und ist im Spiel konfigurierbar. | `hilfsfrist`, `hilfsfristen` |
| **KTW** | Krankentransportwagen: fährt geplante Transporte und unterstützt bei Bedarf, ist aber kein Notfall-Rettungsmittel. | `ktw` |
| **NEF** | Notarzteinsatzfahrzeug: bringt den Notarzt zur Einsatzstelle und fährt zusammen mit einem RTW (Rendezvous). | `nef` |
| **RTW** | Rettungswagen: das primäre Notfall-Rettungsmittel für Transport und Versorgung vor Ort. | `rtw` |

## FMS-Status

Die Statuswerte 0 bis 9, wie sie in `FMS_LEGEND` und den Fahrzeugzuständen
vorkommen:

| Status | Bedeutung |
| --- | --- |
| 0 | Priorisierter Sprechwunsch |
| 1 | Einsatzbereit über Funk |
| 2 | Einsatzbereit auf der Wache |
| 3 | Einsatz übernommen |
| 4 | Am Einsatzort |
| 5 | Sprechwunsch |
| 6 | Nicht einsatzbereit |
| 7 | Patient aufgenommen / Transport |
| 8 | Am Zielort |
| 9 | Sonstiges |

Die Reihenfolge in der Legende ist bewusst nicht numerisch: sie folgt dem
Einsatzablauf von „einsatzbereit“ bis „sonstiges“.
