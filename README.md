# Konzerte in der Petruskirche

Astro-Site fuer Konzerte in der Petruskirche Kiel.

Copyright und Lizenzbedingungen: [COPYRIGHT.md](COPYRIGHT.md)

## Workflow

Immer oben anfangen, dann nach unten:

1. `mise.toml` pinnt Tools.
2. `vp` ist die Arbeitsoberflaeche.
3. `package.json` enthaelt nur Scripts und Dependencies.

```sh
mise trust
mise install
mise run deps
mise run dev
mise run od
mise run quality
```

OpenDesign: `mise run od` baut `dist/` und kopiert es in den OpenDesign-Ordner.

Produktion: Cloudflare Worker mit statischen Seiten und serverseitig gerenderten Programmseiten in `dist/`.

## ChurchTools

Das Programm kommt zur Laufzeit aus dem in ChurchTools als `#5 – Konzerte` angezeigten Kalender unter `https://akg-kiel.church.tools`. Seine REST-API-ID ist `3`; Basis-URL und API-ID stehen in `wrangler.toml`.

Den nur lesenden ChurchTools-Login-Token serverseitig setzen. Der zugehörige Benutzer benötigt Leserechte für Kalender sowie die auf der Seite „Raum anfragen“ geprüften Ressourcen und Buchungen:

```sh
pnpm wrangler secret put CHURCHTOOLS_TOKEN
cp .dev.vars.example .dev.vars # lokale Entwicklung
```

`.dev.vars` wird nicht eingecheckt. Die Programm-, Archiv- und Detailseiten werden am Cloudflare-Edge fünf Minuten gecacht; bei Fehlern kann die letzte erfolgreiche Antwort bis zu 24 Stunden weiter ausgeliefert werden. Programm und Archiv liefern serverseitig höchstens 18 Konzerte pro Ergebnisseite aus. Erfolgreiche Antworten des Verfügbarkeitsendpunkts werden fünf Minuten gecacht. Ist kein Cache vorhanden und ChurchTools nicht erreichbar, antwortet er mit einem klaren 503-Fehler. Der öffentliche Verfügbarkeitsstatus enthält keine Buchungstitel, Personen oder internen Notizen.

### Feldzuordnung

Native ChurchTools-Felder werden so verwendet:

- Titel, Beginn und Ende → Titel, Termin und Dauer in Minuten (gesamte Zeitspanne inklusive etwaiger Pause). Ohne gültiges Ende nach Beginn sowie bei ganztägigen Terminen entfällt die Dauer.
- Link → Ticketlink
- Bild inklusive Fokuspunkt → Konzertbild
- Die Petruskirche ist der Standardort und wird nicht eigens angezeigt. Abweichende Orte über `---Ort` angeben; das native Adressfeld wird nicht angezeigt.

Zusätzliche öffentliche Angaben kommen als einzelne `Feld: Wert`-Zeilen in die ChurchTools-Beschreibung:

```text
Programm: Kurzbeschreibung des Konzerts
Programmhinweise: Ausführliche öffentliche Hinweise
Mitwirkende: Chor, Ensemble oder Solist:innen
Barrierefreiheit: Abweichende Hinweise für diesen Termin
```

Alternativ werden mehrzeilige Abschnitte unterstützt:

```text
---Untertitel
Musik, die Brücken baut
---Kurzbeschreibung
Ein Konzertabend mit dem Hile Trio für Menschen mit und ohne Behinderung.
---Langbeschreibung
Hier steht die ausführliche Beschreibung des Konzerts.

Weitere Absätze sind möglich.
---Program
Joseph Haydn – Klaviertrio D-Dur, Hob. XV:7

Antonín Dvořák – Klaviertrio Nr. 4 e-Moll, op. 90 „Dumky“
---Programmhinweise
Eintritt frei. Keine Anmeldung erforderlich.
---Einlass
15:30 Uhr
---Pause
Ohne Pause
---Ort
Nikolaikirche Kiel
---Mitwirkende
Hile Trio
---Barrierefreiheit
Kostenloser Fahrdienst nach vorheriger Anmeldung.
---Intern
Dieser Abschnitt wird nicht veröffentlicht.
```

`---Programm` wird ebenfalls akzeptiert. Jeder Abschnitt reicht bis zur nächsten `---`-Überschrift; alle Zeilen darin sind öffentlich, auch Kontaktangaben. Unbekannte Abschnitte und Text vor dem ersten Abschnitt (außer den bisherigen `Feld: Wert`-Angaben) werden nicht veröffentlicht. Innerhalb eines Abschnitts ist `Feld: Wert` normaler Text; zum Feldwechsel eine neue `---`-Überschrift verwenden. Der Untertitel erscheint auf Konzertkarten und Detailseiten. `---Kurzbeschreibung` erscheint auf den Konzertkarten und der Detailseite; fehlt sie, nutzen Karten wie bisher das Programm. `---Langbeschreibung` erscheint ausschließlich auf der Detailseite und unterstützt mehrere Absätze. Beide Beschreibungen sind unabhängig von `---Program` und `---Programmhinweise`, werden durchsucht und bei leerem Inhalt ausgeblendet.

`---Pause` akzeptiert `true` / `false`, `Mit Pause` / `Ohne Pause` oder `ja` / `nein` (Groß-/Kleinschreibung egal). Leer oder unbekannt bedeutet keine Anzeige. Alle optionalen Angaben bleiben bei leerem Inhalt ausgeblendet, ohne Ersatztext oder pauschale Einlass-/Barrierefreiheitsangaben. `---Einlass` ist frei formulierbar, z. B. `15:30 Uhr` oder `30 Minuten vor Beginn`. Das Veranstaltungsbild steht auf der Detailseite unbeschnitten neben dem Text, auf kleinen Bildschirmen darunter; es lässt sich in voller Größe öffnen.
