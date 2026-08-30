# Konzerte in der Petruskirche

Astro-Site fuer Konzerte in der Petruskirche Kiel.

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

`.dev.vars` wird nicht eingecheckt. Die Programm-, Archiv- und Detailseiten werden am Cloudflare-Edge fünf Minuten gecacht; bei Fehlern kann die letzte erfolgreiche Antwort bis zu 24 Stunden weiter ausgeliefert werden. Erfolgreiche Antworten des Verfügbarkeitsendpunkts werden fünf Minuten gecacht. Ist kein Cache vorhanden und ChurchTools nicht erreichbar, antwortet er mit einem klaren 503-Fehler. Der öffentliche Verfügbarkeitsstatus enthält keine Buchungstitel, Personen oder internen Notizen.

### Feldzuordnung

Native ChurchTools-Felder werden so verwendet:

- Titel, Beginn und Ende → Titel und Termin
- Link → Ticketlink
- Bild inklusive Fokuspunkt → Konzertbild
- Adresse → Veranstaltungsort; ohne Adresse gilt die Petruskirche

Zusätzliche öffentliche Angaben kommen als einzelne `Feld: Wert`-Zeilen in die ChurchTools-Beschreibung:

```text
Programm: Kurzbeschreibung des Konzerts
Programmhinweise: Ausführliche öffentliche Hinweise
Mitwirkende: Chor, Ensemble oder Solist:innen
Barrierefreiheit: Abweichende Hinweise für diesen Termin
```

Andere Beschreibungszeilen werden bewusst nicht veröffentlicht, damit interne Aufbauzeiten und Kontaktdaten nicht auf der Website landen.
