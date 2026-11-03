# Konzerte in der Petruskirche

Astro-Site fuer Konzerte in der Petruskirche Kiel.

Copyright und Lizenzbedingungen: [COPYRIGHT.md](COPYRIGHT.md)

## Workflow

[Nix installieren](https://nix.dev/install-nix) und die Features `nix-command`
und `flakes` in `~/.config/nix/nix.conf` aktivieren:

```conf
experimental-features = nix-command flakes
```

Anschließend [devenv](https://devenv.sh/getting-started/) installieren:

```sh
nix profile add github:NixOS/nixpkgs/nixos-26.05#devenv
```

NixOS ist nicht erforderlich. Die Umgebung unterstützt Linux und macOS auf
x86_64 und ARM64; unter Windows kann Nix in WSL2 verwendet werden.

### Standard der Projektumgebung

Nix und Bash bilden die Grundlage; devenv darf global installiert sein.
Globale persönliche Werkzeuge wie Pi, Node oder npm-Pakete sind erlaubt, aber
keine Voraussetzung für Projektbefehle. Die devenv-Shell liefert die benötigten
Projektwerkzeuge und Laufzeitbibliotheken; darin haben die Projektversionen Vorrang.
JavaScript-Abhängigkeiten einschließlich Vite+ bleiben in `package.json` und dem
Lockfile. Die Installation bleibt ein eigener Setup-Schritt mit
`pnpm install --frozen-lockfile`, keine Nebenwirkung des Shell-Starts.

`devenv test --clean` prüft mit bereinigter Umgebung. Das ist eine eigenständig
funktionierende Toolumgebung, keine Container- oder Sicherheitsisolation.

### Projekt bedienen

devenv ist die oberste Bedienoberfläche. JavaScript-Aufgaben laufen über das
projektlokale `pnpm exec vp run <Aufgabe>`; Vite+ führt die portablen Paket-Skripte
und deren Verkettungen aus. pnpm verwaltet Abhängigkeiten und Lockfile; `pnpm exec`
startet hier nur das lokale VP-Binary. Kein `vp install` oder `vp env`.

Ohne Nix/devenv, etwa in Cloudflare Builds, bleibt derselbe JS-Einstieg nutzbar:

```sh
pnpm install --frozen-lockfile
pnpm exec vp run quality
```

Astro bleibt für Entwicklung und Build zuständig: `vp run dev` und `vp run build`
führen die Paket-Skripte aus; `vp dev` und `vp build` würden Vite+ direkt starten. Vorhandene
Node-Tests bleiben Node-Tests. Zusätzliches Task-Caching wird nicht aktiviert.

| Befehl                             | Aufgabe                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| `devenv up`                        | Abhängigkeiten vorbereiten und den Entwicklungsserver starten |
| `devenv tasks run project:setup`   | Abhängigkeiten mit eingefrorenem Lockfile installieren        |
| `devenv tasks run project:check`   | Format/Lint, Typen und vorhandene Offline-Tests prüfen        |
| `devenv tasks run project:build`   | Produktionsartefakte bauen                                    |
| `devenv tasks run project:quality` | Gemeinsames Quality-/Build-Gate ausführen                     |
| `devenv test --clean`              | Vollständige projektspezifische Abnahme ausführen             |

Check, Build, Quality und Entwicklungsserver hängen vom Setup ab. Das reine
Öffnen von `devenv shell` installiert weiterhin nichts. Für einzelne
Paketmanager-Operationen bleibt etwa `devenv shell -- pnpm add <Paket>`.

Der Entwicklungsserver bindet nur an `127.0.0.1`; devenv vergibt einen freien Port
ab 4321. Die tatsächliche URL steht im Serverlog. Im Vordergrund beendet Ctrl+C
den Stack. Nach `devenv up -d` beendet `devenv processes down` die Hintergrundprozesse.
`devenv test` startet nicht zusätzlich den Entwicklungsserver. Build-/Quality- und
Preview-Läufe im selben Worktree nacheinander ausführen; einen laufenden Dev-Stack
vorher beenden, damit Workerd nicht um denselben lokalen SQLite-State konkurriert.

1. `devenv.nix` stellt Node.js 22.23.4, pnpm 11.27.0, Bash, Coreutils und Git
   sowie Chromium samt Laufzeitbibliotheken und Fonts für die vorhandenen Browserchecks bereit.
2. `devenv.yaml` und `devenv.lock` pinnen die Nix-Quellen und exakten Revisionen.
3. Vite+ bleibt projektlokal in `package.json` und `pnpm-lock.yaml`; eine globale
   Vite+-Installation ist nicht nötig.

```sh
devenv up
```

Innerhalb der Shell:

- `pnpm exec vp run check`: Offline-Tests, Vite+-Checks und Typprüfung
- `pnpm exec vp run quality`: Checks und Build
- `pnpm run ci`: Kompatibilitätseinstieg mit Frozen-Lockfile-Installation, danach
  `vp run quality` für Checks und Build
- `pnpm exec vp run od`: `dist/` bauen und in den OpenDesign-Ordner kopieren

Ohne interaktive Shell führt `devenv test --clean` die Aufgaben `project:setup`
und `project:quality` aus und prüft anschließend den Nix-Browserstart.
Die Paket-Skripte bleiben auch ohne devenv für Cloudflare Builds nutzbar.
Beim Betreten der Shell werden keine npm-Pakete automatisch installiert.
Unter Linux startet devenv das im pnpm-Lockfile fixierte `workerd` über den
Nix-Loader. Dadurch funktionieren Cloudflare-Dev-Server und Prerendering auch
auf NixOS, ohne die npm-Binaries oder den pnpm-Store zu verändern. Unter macOS
wird das native npm-Binary verwendet.
Die Installation richtet weiterhin den Vite+-Pre-Commit-Hook ein; Git-Kommandos
sollten deshalb ebenfalls innerhalb von `devenv shell` ausgeführt werden.
GitHub Actions installiert Nix und devenv aus der gesperrten Nixpkgs-Revision
und führt `devenv test --clean` aus. Beide Lockfiles müssen unverändert bleiben.

Toolchain-Updates: `devenv update nixpkgs` ausführen, anschließend die Ausgabe von
`devenv shell -- pnpm --version` mit `packageManager` in `package.json` abgleichen.
pnpm darf keine andere Version nachladen. Danach `devenv test --clean` ausführen und
`devenv.lock` sowie gegebenenfalls `pnpm-lock.yaml` einchecken.

Produktion: Cloudflare Worker mit statischen Seiten und serverseitig gerenderten Programmseiten in `dist/`.

## Kontaktformulare

Die Quellkonfiguration aktiviert den direkten Versand für Kontakt und Raumanfrage
mit `CONTACT_FORMS_ENABLED = "true"`. Öffentliche Konzertadresse und fester Empfänger
sind `kontakt@petruskirche.events`; Gemeinde-, Technik- und Datenschutzadressen bleiben
eigenständig. Der Besucher bestimmt ausschließlich `Reply-To`, niemals den Empfänger.
Der technische Absender bleibt `formular@formmail.petruskirche.events` auf der getrennten
Cloudflare-Routing-Subdomain. Die Hauptdomain behält IONOS-MX/SPF.

Empfang, beide vollständigen Formularpfade mit echtem Turnstile und Antworten unter
der neuen Identität wurden in der isolierten Vorschau vom Nutzer bestätigt. Am
21.10.2026 hat der Nutzer ausdrücklich die Aktivierung auf der Hauptdomain und je
eine gekennzeichnete Testnachricht genehmigt, obwohl die formale Datenschutz- und
Rechtstextfreigabe in AKG-113 noch offen ist. Das ist keine rechtliche Freigabe;
Prelaunch-`noindex` bleibt bestehen.

[Versand, Aktivierung und Abnahme](docs/email-forms.md) dokumentiert den konkreten
Veröffentlichungs-/Prüfstand und die verbleibenden Freigaben. Nicht die alte
Testversion mit Vorschau-Hostliste auf Produktion promoten: statisches HTML und
Worker-Konfiguration gemeinsam neu bauen und prüfen. Bestehende Secrets erhalten;
`TURNSTILE_SECRET` niemals auslesen. Adresse/Flag allein im Dashboard ändern reicht
für das vorgerenderte HTML nicht. Offline- und lokale Browserchecks verwenden Mocks
und senden keine echten Nachrichten.

## ChurchTools

Das Programm kommt zur Laufzeit aus dem in ChurchTools als `#5 – Konzerte` angezeigten Kalender unter `https://akg-kiel.church.tools`. Seine REST-API-ID ist `3`; Basis-URL und API-ID stehen in `wrangler.toml`.

Den nur lesenden ChurchTools-Login-Token serverseitig setzen. Der zugehörige Benutzer benötigt Leserechte für Kalender sowie die auf der Seite „Raum anfragen“ geprüften Ressourcen und Buchungen:

```sh
pnpm wrangler secret put CHURCHTOOLS_TOKEN
cp .dev.vars.example .dev.vars # lokale Entwicklung
```

`.dev.vars` wird nicht eingecheckt. Die ChurchTools-Antworten werden am Cloudflare-Edge fünf Minuten gecacht; bei Fehlern kann die letzte erfolgreiche Datenantwort bis zu 24 Stunden weiter verwendet werden. Programm und Archiv liefern serverseitig höchstens 18 Konzerte pro Ergebnisseite aus. Ihre ersten Ergebnisseiten werden gemeinsam vorbereitet; bei einem gefilterten Einstieg kommt die angefragte Ergebnisansicht hinzu. Nur die aktive Ansicht ist sichtbar und zugänglich. Programm-/Archiv-HTML wird nicht frisch im Browser/CDN gehalten, damit eine abgelaufene lokale Ansicht nicht durch dieselbe alte HTML-Kopie ersetzt wird. Erfolgreiche Antworten des Verfügbarkeitsendpunkts werden fünf Minuten gecacht. Ist kein Cache vorhanden und ChurchTools nicht erreichbar, antwortet er mit einem klaren 503-Fehler. Der öffentliche Verfügbarkeitsstatus enthält keine Buchungstitel, Personen oder internen Notizen.

Das CT-Abruffenster umfasst zusätzlich die tatsächlichen Kirchenraum-Pufferstunden vor und nach den angefragten Berliner Kalendertagen, auch über Zeitumstellungen. Die Antwort enthält trotzdem nur den angefragten Zeitraum; ein Einzeltermin darf nicht anders bewertet werden als derselbe Tag im Monatsfenster.

Die Verfügbarkeitsprüfung verwendet Beginn und Ende derselben berechneten Buchungsinstanz; nur ohne berechnete Instanz fällt sie auf das vollständige Basisintervall zurück. Zeitstempel behalten ihr exklusives Ende. Reine Datumswerte werden als Berliner Kalendertage einschließlich Endtag ausgewertet; die nächste lokale Mitternacht ist die exklusive Grenze, auch an 23-/25-Stunden-Tagen. Diese Endtagskonvention ist durch die [offizielle Ressourcen-Wochenansicht](https://akg-kiel.church.tools/system/churchresource/cr_weekview.js) und einen [aktuellen REST-Consumer](https://github.com/curatorsigma/room-overview/blob/cccb1811be164a42be6698ad3c34b05501f8993c/src/pull_from_ct.rs#L339-L391) gestützt, in der [REST-Spezifikation](https://akg-kiel.church.tools/system/runtime/swagger/openapi.json) aber nicht ausdrücklich definiert. Der lesende CT-Gegencheck am 13.10.2026 bestätigte außerdem eine gültige Eintagesbuchung mit gleichen Start-/Enddaten sowie unabhängige Belegungs-/Freireferenzen. ID4 ist laut CT „Petruskirche“; ID15/21 liegen an derselben CT-Standortadresse, die übrigen bisher berücksichtigten Nebenräume an einer anderen. Welche Nebenräume für Konzertanfragen zählen sollen, bleibt eine Betreiberentscheidung. Die Rechte des separat geprüften CT-Projektclients belegen nicht automatisch die Rechte der Worker-Identität; ein erfolgreicher API-Abruf allein ist keine fachliche Freigabe. Ungültige oder unvollständige Intervalle liefern weiterhin uncached HTTP 503 statt erfundener freier Termine.

### Feldzuordnung

Native ChurchTools-Felder werden so verwendet:

- Titel, Beginn und Ende → Titel, Termin und Dauer in Minuten (gesamte Zeitspanne inklusive etwaiger Pause). Ohne gültiges Ende nach Beginn sowie bei ganztägigen Terminen entfällt die Dauer.
- Link → Ticketlink
- Bild inklusive Fokuspunkt → Konzertbild
- Veranstaltungsort → `---Ort`, sonst der Name im nativen Adressfeld. Es gibt keinen geratenen Standardort. Die native Adresse wird nur angezeigt, wenn ihr Name zum gewählten Ort passt; widersprüchliche oder unbenannte Adressen bleiben ausgeblendet.

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

`---Pause` akzeptiert `true` / `false`, `Mit Pause` / `Ohne Pause` oder `ja` / `nein` (Groß-/Kleinschreibung egal). Leer oder unbekannt bedeutet keine Anzeige. Alle optionalen Angaben bleiben bei leerem Inhalt ausgeblendet, ohne Ersatztext oder pauschale Einlass-/Barrierefreiheitsangaben. `---Einlass` ist frei formulierbar, z. B. `15:30 Uhr` oder `30 Minuten vor Beginn`. ChurchTools-Bilder werden mit bis zu 1200 px Breite im ursprünglichen Seitenverhältnis abgerufen. Konzertkarten und Detailseiten zeigen einen kompakten 4:3-Ausschnitt, dessen Mittelpunkt der ChurchTools-Fokuspunkt ist; der Ausschnitt wird an den Bildrändern begrenzt. Die responsiven WebP-Varianten laden auf Karten verzögert, auf der Detailseite vorrangig. Ein sichtbarer Bildlink öffnet das vollständige Plakat. Auf der Detailseite stehen Titel, Wochentag/Datum, Beginn, Einlass, Ort und Ticketaktion rechts neben dem Bild, auf kleinen Bildschirmen direkt darunter und vor längerem Text. Untertitel, Beschreibungen, Programm und Mitwirkende folgen in einem separaten Lesebereich; weitere Besuchsangaben sind davon klar getrennt. Vergangene Konzerte verweisen auf das aktuelle Programm statt auf einen Ticketkauf. Fehlende Angaben bleiben ausgeblendet. Mitwirkende erscheinen nur auf der Detailseite. Abschnitte mit nicht ausgefüllten Template-Anweisungen (`[...]` oder `{{...}}`) werden vollständig ausgeblendet, bis die Quelldaten bereinigt sind.

## Cloudflare-Previews in Pull Requests

Der bestehende Versions-Preview-Build für Nicht-`main`-Branches verwendet `pnpm exec vp run build` und `pnpm exec wrangler versions upload --keep-vars`, ohne Produktion umzuschalten. Der Hauptbranch-Build bleibt davon getrennt. Diese Versions-Previews verwenden bestehende Ressourcen; sie sind von der isolierten Worker-Previews-Beta zu unterscheiden.

`.github/workflows/preview-comments.yml` hält nach Cloudflare-Checks und beim Öffnen/Aktualisieren eines PRs einen eigenen verwalteten Kommentar aktuell. Er verwendet die unveränderliche Versions-URL des aktuellen Commits; neue Pushes oder fehlgeschlagene Builds ersetzen einen alten Bereit-Link durch einen Statushinweis. Zusätzliche erfolgreiche Metadatenchecks verdrängen keinen vorhandenen Versions-Link desselben Commits. Bereits nachgetragene Kommentare werden übernommen. Der Workflow lässt sich mit `workflow_dispatch` auch für alle offenen PRs nachholen.

Der Workflow benötigt nur das eingebaute `GITHUB_TOKEN`, keine Cloudflare-Secrets. Er führt ausschließlich Code des Default-Branches aus, ignoriert Forks und Produktionsbranches und akzeptiert nur erfolgreiche Checks der Cloudflare-App sowie HTTPS-Versions-URLs dieses Workers. `pnpm test` prüft Kommentar-Lebenszyklus, Idempotenz und die Sicherheitsgrenzen offline. **Aktiv wird der Workflow erst, wenn er auf dem Default-Branch liegt.** Preview-noindex und die Beschränkung des Formularversands auf die Hauptdomain bleiben bestehen.

## SEO und bestehende Links

`astro.config.mjs` ist die Quelle der kanonischen Domain. `https://petruskirche.events` wurde am 13.10.2026 als Hauptdomain bestätigt und ist als öffentliche Vorabversion am bestehenden Worker angebunden. Das ist keine Launch-/Indexierungsfreigabe; die produktive SEO-Abnahme bleibt offen. Sitemap und `robots.txt` werden zur Laufzeit erzeugt. Die Sitemap nutzt den vorhandenen ChurchTools-Cache, berücksichtigt Detailseiten und gültige Programm-/Archivseiten und liefert bei einem nicht abgefangenen Quelldatenfehler HTTP 503 statt einer erfolgreichen leeren Liste. Filterseiten und ungültige/geklemmte Seitenparameter sind `noindex`; gültige Folgeseiten sind selbstkanonisch.

`INDEXING_ENABLED = false` in `src/lib/seo.ts` hält die gesamte Vorabversion einschließlich Hauptdomain auf `noindex`. Das gemeinsame Layout setzt den Meta-Tag auch in statisch erzeugtem HTML; der Worker läuft vor allen Assets und setzt zusätzlich `X-Robots-Tag: noindex, follow` auf HTML, Bilder, PDFs und Fehlerantworten. Crawling öffentlicher Seiten bleibt erlaubt, damit Crawler den Header lesen können. Die deaktivierte `workers.dev`-Adresse bleibt durch `workers_dev = false` bei späteren Deployments deaktiviert. `preview_urls = true` erhält die separat aktivierten Version-/Preview-URLs, deren Antworten ebenfalls `noindex` bleiben.

Erst nach ausdrücklicher Launch-Freigabe `INDEXING_ENABLED` samt der expliziten Vorab-Regression umstellen und die temporären Cloudflare-noindex-Headerregeln entfernen. Danach bleiben andere Hosts, technische Antworten und Fehlerseiten geschützt. Hauptdomain-Auswahl oder Domain-Anbindung allein gibt die Indexierung nicht frei.

Konzertdetails erhalten eigene Metadaten und faktenbasierte, sicher serialisierte Event-Daten. Alte title-basierte Detail-Slugs können über CT-ID und Occurrence-Datum auf die aktuelle URL umleiten; mehrdeutige Wiederholungen bleiben 404. Datenvertrag, Quelldatenlücken und ausstehende Rich-Results-Abnahme: [docs/seo/event-data.md](docs/seo/event-data.md). Copy-Abnahme: [docs/copy-audit.md](docs/copy-audit.md). Legacy-Host-Migration: [docs/migration/README.md](docs/migration/README.md).

`pnpm exec vp run test` prüft Mapping/Bilder, Verfügbarkeit, Formularsicherheit und SEO/Weiterleitungen offline. `pnpm exec vp run build` prüft zusätzlich die generierte Worker-Konfiguration und statisches SEO-Markup. Produktionsdomain, externe Validatoren und tatsächliche Deployments werden dadurch nicht als bestanden bestätigt.

`ProgrammePage.astro` teilt Kopfbereich, natives GET-Suchformular und die vorbereiteten Programm-/Archivansichten. Ein frischer Bereichswechsel verwendet Astros Loader-/Swap-Hooks, ohne HTML-Abruf, Body-Austausch oder Formular-Hydration; Astro verwaltet weiterhin URLs, Metadaten, History und Ankündigungen. Die lokale Ansicht gilt höchstens fünf Minuten und nie über einen bekannten Konzertende-/Berliner Tageswechsel hinaus. Ihre Laufzeit wird monoton ab Abrufbeginn gemessen, unabhängig von der Geräteuhr; ausgeblendete Dokumente werden vorsorglich invalidiert. Abgelaufene Ansichten, Fehler, Suchanfragen und Pagination verwenden weiter den normalen Serverpfad. Scrollposition/Fokus, direkte URLs und Links ohne JavaScript bleiben erhalten. Nur diese beiden Seiten verwenden den Client-Router. Gegen einen laufenden Preview-Server lassen sich die gerenderten aktiven Links und der echte Browserwechsel separat prüfen (innerhalb von `devenv shell`; `CHROME_BIN` kommt bereits aus Nix):

```sh
node --experimental-strip-types scripts/check-seo-infrastructure.mjs --origin=http://127.0.0.1:4321
node scripts/check-programme-navigation.mjs --origin=http://127.0.0.1:4321
```

Der Browsercheck prüft bei 320 bis 1920 Pixeln denselben Wrapper, Scrollposition, Fokus und Zurück/Vorwärts ohne HTML-/Dokument-Request, Body-Austausch oder neues Suchformular. Einstiegskosten, kontrollierte Vergleichsmessungen und die Grenzen der lokalen Abnahme stehen in [docs/performance/programme-navigation.md](docs/performance/programme-navigation.md).
