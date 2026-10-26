# SEO-Keyword-Set und Seitenzuordnung

AKG-104 · Stand: 26. Oktober 2026 · Hauptdomain: `https://petruskirche.events`

## Strategie

- **Besuchernachfrage:** „Konzerte Kiel“ und „Konzerte in Kiel“ führen zum aktuellen Programm. Die Startseite stellt die Konzertstätte vor und führt dorthin.
- **Marke:** „Konzertkirche Kiel“ verbindet die Petruskirche mit ihrem Standort. Bevorzugte Bezeichnung: **Die Petruskirche – Kiels Konzertkirche** (AKG-85).
- **Einzelkonzerte:** Künstler, Programm, tatsächlicher Ort und Termin bedienen konkrete Long-Tail-Suchen auf der jeweiligen Detailseite.

Dies ist eine redaktionelle Zuordnung, keine gemessene Suchvolumen- oder Rankingprognose. Die aktive Vorabversion bleibt `noindex`; dieses Dokument ist keine Launch-/Indexierungsfreigabe (AKG-123).

## Suchbegriffe und Zielseiten

Alle Pfade beziehen sich auf die Hauptdomain. „Primär“ bezeichnet die inhaltlich passendste Zielseite, nicht ein zusätzliches Canonical oder eine neue Route.

| Suchbegriff / Gruppe                                                 | Primäres Ziel                                            | Absicht und Inhalt                                                                                                                                                               |
| -------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Konzerte Kiel`, `Konzerte in Kiel`                                  | `/programm/`                                             | Aktuelle Termine finden, nach Datum/Text suchen, zum Konzert und gegebenenfalls Ticketanbieter wechseln. Die Startseite unterstützt mit einer Auswahl und direktem Programmlink. |
| `Petruskirche Kiel Konzerte`, `Konzerte Petruskirche Kiel`           | `/programm/`                                             | Das Konzertangebot dieser Kirche finden. Titel, Einleitung und Konzertkarten bleiben konkret statt alle Wortvarianten aufzuzählen.                                               |
| `Konzertkirche Kiel`                                                 | `/`                                                      | Konzertstätte und Marke kennenlernen: Petruskirche, Architektur, Raumklang und Zugang zum Programm.                                                                              |
| `Kirchenkonzerte Kiel`                                               | `/programm/`                                             | Passende Konzerte entdecken; Genres nur nennen, soweit sie zum tatsächlichen Programm gehören.                                                                                   |
| `Konzertkirche` (Stretch Goal)                                       | `/`                                                      | Überregionaler Markenbegriff; nachrangig gegenüber der klaren lokalen Zuordnung. Keine zusätzliche Keyword-Landingpage.                                                          |
| `[Künstler] Kiel`, `[Künstler] Petruskirche`                         | `/programm/<slug>/`                                      | Ein konkretes Konzert bzw. Mitwirkende finden. Nur den tatsächlichen Ort und bestätigte Künstlernamen verwenden.                                                                 |
| `[Künstler] Kiel 2027`                                               | `/programm/<slug>/` des betreffenden Termins             | Datumsbezogene Suche. 2027 ist ein Beispiel: Jahr aus dem tatsächlichen Termin übernehmen, nicht jährlich alle Seiten umbenennen.                                                |
| `Weihnachtskonzert Kiel`, `Chorkonzert Kiel`, `Klassik Konzert Kiel` | Passende `/programm/<slug>/`; `/programm/` als Übersicht | Anlass, Besetzung oder Genre müssen aus den Veranstaltungsdaten hervorgehen. Keine Weihnachts-/Chor-/Klassikbehauptung nur für Suchbegriffe ergänzen.                            |

## Ergänzende Seitenrollen

- `/besuch-planen/`: Anfahrt, Parken, Einlass und Barrierefreiheit für den Besuch der Petruskirche. Keine konkurrierende allgemeine Konzertliste; veränderliche Ortsangaben benötigen fachliche Bestätigung (AKG-109/113).
- `/kontakt/#ueber-uns`: Konzertmanagement und Gemeindezugehörigkeit. Es gibt keine eigene `/ueber-uns/`-Route.
- `/für-veranstalter/`: Raum-, Technik- und Terminanfragen; keine Besucher-Ticketseite. `/raum-anfragen/` ist lediglich eine Weiterleitung.
- `/programm/archiv/`: Vergangene Veranstaltungen und historische Suchen. Die Detail-URL bleibt auch nach dem Konzert erhalten; vergangene Termine nicht als kommende bewerben.
- Such-/Filter-URLs sind keine neuen Keyword-Zielseiten. Bestehende Canonical-, Pagination- und noindex-Regeln bleiben unverändert.

## Redaktionelle Anwendung

1. Pro Seite eine klare Suchabsicht: verständlicher Titel, eine H1 und eine zutreffende Kurzbeschreibung. Keine Keyword-Listen, versteckten Texte oder `meta keywords`.
2. Bestehende Homepage-Metadaten (`Konzerte in Kiel | Petruskirche – Kiels Konzertkirche`) und Programm-Metadaten (`Konzerte in Kiel | Programm der Petruskirche`) erfüllen unterschiedliche Aufgaben. Nicht beide mit identischen Texten bestücken.
3. Konzerttitel, Mitwirkende, Beschreibungen, Ort und Datum werden in ChurchTools gepflegt. Das bestehende Mapping erzeugt daraus Detailtexte und Metadaten; keine SEO-Sonderkopien im Repository. Fehlende Angaben bleiben fehlend, insbesondere bei anderen Veranstaltungsorten (siehe [Event-Datenvertrag](event-data.md)).
4. Interne Links nennen ihr Ziel, etwa „Programm“, den Konzerttitel oder „Besuch planen“. Externe Partner erhalten nach Freigabe die konkrete Detail-URL; Kommunikation wird separat in AKG-99/100/105 verfolgt.

## Spätere Erfolgskontrolle

Nach Launch-Freigabe und Einrichtung der Search Console (AKG-123/97) diese Gruppen und die zugeordneten Seiten gemeinsam auswerten: Impressionen, Klicks, CTR und Position. Brand-/Nicht-Brand- sowie Termin-Suchen getrennt betrachten; Zeitraum, Gerät und saisonalen Veranstaltungskontext festhalten (AKG-108).

Titles/Descriptions erst bei ausreichenden tatsächlichen Daten und unter Berücksichtigung der Suchabsicht gezielt ändern (AKG-107). Derzeit wird weder ein Ranking-Erfolg noch eine Search-Console-Auswertung behauptet.
