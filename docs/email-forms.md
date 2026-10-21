# Kontaktadresse und direkter Formularversand

Vorbereitung für AKG-119, Stand 19. Oktober 2026. **Produktivformulare nicht aktiviert.**
Die native Einzeltestmail und anschließend die vollständigen Kontakt- und
Raumanfrage-Tests mit echtem Turnstile wurden zugestellt und vom Nutzer bestätigt.
Die Produktivfreigabe sowie die unten genannten Einzelprüfungen bleiben separat.

## Isolierter Versandtest vom 16. Oktober

Nach gesonderter Freigabe wurde nur `formmail.petruskirche.events` für Email Routing
eingerichtet. Cloudflare bestätigte diese Domain als `enabled: true`, `ready`.
Angelegt wurden drei Cloudflare-MX-Einträge und ein SPF-TXT-Eintrag auf dieser
Subdomain. Die Hauptdomain behält unverändert IONOS (`mx00.ionos.de`, `mx01.ionos.de`,
je Priorität 10, und `v=spf1 include:_spf-eu.ionos.com ~all`). Der Vergleich erfolgte
vor und nach der Einrichtung direkt gegen den autoritativen Nameserver.

**Wichtig:** Cloudflare setzt dabei auch den zonenweiten Routing-Schalter auf
`enabled`, zeigt die Hauptdomain aber als `misconfigured`, weil dort bewusst die
IONOS-Mailserver bleiben. Diesen Hinweis **nicht** durch einen DNS-Fix für die
Hauptdomain beheben. Ausschließlich die getrennte Absender-Subdomain wird genutzt.

`noah.zepner@akg-kiel.de` war im selben Konto bereits als Destination verifiziert.
Um 08:40:02 UTC wurde genau ein synthetischer Testversuch über eine nur lokal
erreichbare Wrangler-Entwicklungssitzung mit echtem, auf dieses Ziel beschränktem
Remote-Mailbinding durchgeführt. Verwendet wurde die native `EmailMessage`-API,
nicht das kostenpflichtig freizuschaltende allgemeine Email-Sending-Dashboard.
Absender: `formular@formmail.petruskirche.events`; Betreff:
`Petruskirche - einmaliger Cloudflare-Test`. Cloudflare lieferte eine Message-ID,
der Nutzer bestätigte anschließend den Empfang. Es gab keine automatische
Wiederholung; die Testsitzung wurde danach beendet.

Produktiv-Deployment, Binding-Namen/-Typen und URL-Einstellungen des bestehenden
Workers wurden vor/nach dem Test verglichen und blieben unverändert. Kein Paid-
Upgrade, kein öffentliches Formular aktiviert, keine echten Besucherdaten.
Diese Einzelzustellung ist kein Beleg für zukünftige Zustellgarantien,
DKIM-/DMARC-Headerwerte oder die vollständige Formular-/Turnstile-Funktion.

## Aktuelle Formularvorschau

Der Nutzer hat das Managed-Turnstile-Widget im Dashboard erstellt und
`TURNSTILE_SECRET` im bestehenden Worker `web-konzerte` als Secret gespeichert.
Geprüft wurden nur Binding-Name und -Typ, niemals der geheime Wert.

Die isolierte Vorschau liegt unter
`https://mailtest-web-konzerte.noah-zepner.workers.dev` mit den Pfaden
`/kontakt/` und `/für-veranstalter/`. Nur dort sind die Formulare freigeschaltet:
`CONTACT_RECIPIENT` und das native Mailbinding sind seit 18. Oktober fest auf
`kontakt@petruskirche.events` beschränkt. Cloudflare bestätigt diese Destination
seit 16. Oktober, 13:50:15 UTC; der Status wurde am 18. Oktober lesend geprüft.
Die öffentlich sichtbare Adresse bleibt bis zur gesondert freigegebenen
Umstellung `konzerte@akg-kiel.de`. Die Server-Hostliste enthält ausschließlich den
exakten Vorschauhost. Der Nutzer bestätigte anschließend mit „Ja passt alles“
die erbetenen Tests beider Formulare an die neue Adresse sowie eine Antwort
mit Absender `kontakt@petruskirche.events` an die eigene Besucher-Testadresse.
Damit sind auch der neue Zustellweg und die Antwortidentität funktional
bestätigt. Durch die Umstellung oder diese Bestätigung wurde keine zusätzliche
Nachricht automatisch versandt.

**Diese Testversion nicht auf Produktion deployen.** Upload und Vorschau-Alias
sind keine Traffic-Promotion. Der aktive Produktivstand und dessen Bindings
werden anhand der Deployment-Version geprüft: Workers `/settings` zeigt nach
einem Upload bereits die letzte hochgeladene Version, nicht zwingend die aktive.
Die produktive Kontaktseite bleibt Mailprogramm-basiert und `noindex`.

Die echte Sicherheitsprüfung deckte einen Laufzeitfehler mit `redirect: "error"`
auf. Der Handler verwendet jetzt `manual` und verwirft jeden Redirect, ohne das
Secret an ein anderes Ziel weiterzugeben. Ungültige Tokens werden damit auch
im echten Worker abgewiesen; Offlinechecks sichern zusätzlich 302-Antworten ab.

Das echte Managed-Widget zeigte im automatisierten Browser eine interaktive
Bestätigung, die nicht umgangen wurde. Anschließend führte der Nutzer beide
Formulartests selbst durch und bestätigte am 16. Oktober: „Das hat beides geklappt“
(auf die Frage nach dem Empfang beider Nachrichten). Damit sind der vollständige
Anwendungspfad mit echtem Turnstile, strukturiertem nativen Mailbinding und
Zustellung an die frühere feste Testadresse `noah.zepner@akg-kiel.de` für Kontakt
und Raumanfrage bestätigt.

Die spätere Bestätigung für die neue Zieladresse ist oben getrennt dokumentiert.
Nicht daraus ableiten: Analyse roher SPF-/DKIM-/DMARC- oder Reply-To-Header,
Spamklassifikation, echte Replay-/Ablaufabnahme oder garantierte zukünftige
Zustellung. Es wurde kein weiterer automatischer Versand ausgelöst und nichts
produktiv aktiviert.

## Sicherer Ausgangszustand

In `wrangler.toml` bleiben `CONTACT_EMAIL = "konzerte@akg-kiel.de"`,
`CONTACT_FORMS_ENABLED = "false"` gesetzt. Der vom Nutzer bereitgestellte öffentliche
Turnstile-Sitekey ist inzwischen hinterlegt; das private Secret ist im Worker
gespeichert und im echten Formularpfad der isolierten Vorschau erfolgreich genutzt.
Beide Formulare öffnen dadurch weiterhin das Mailprogramm. Die neue Adresse
wird noch nicht öffentlich als erreichbar ausgegeben. Es wird kein Turnstile
von diesen Formularen geladen; `/api/contact/` verweigert den Versand.

Vorbereitet sind:

- `kontakt@petruskirche.events` als geplante öffentliche Konzertadresse und
  Produktivempfänger;
- `CONTACT_EMAIL` für die erlaubte öffentliche Adresse und `CONTACT_RECIPIENT`
  für den festen, validierten Empfänger der jeweiligen Deployment-Konfiguration;
  ein Besucher kann den Empfänger weder im Formular noch per Query wählen;
- `formular@formmail.petruskirche.events` als fester technischer Absender auf der
  getrennten Routing-Subdomain;
- die Besucheradresse ausschließlich als `Reply-To`;
- ein auf diese Adressen beschränktes natives `MAILER`-Binding;
- zwei Aktionen, `contact` und `booking`, mit serverseitiger Turnstile-Prüfung;
- eine gemeinsame Adresse für Kontaktseite, Konzertkontakt im Impressum und
  Footer. Gemeinde-, Technik- und Datenschutzadressen bleiben eigenständig.

Die statischen Seiten lesen Adresse, Freischaltung und öffentlichen Sitekey beim
**Build** aus der Worker-Konfiguration. Eine reine Dashboard-Änderung aktiviert
nicht zuverlässig das bereits gebaute HTML. Konfigurationsänderungen müssen
zusammen gebaut, geprüft und veröffentlicht werden.

Das vorbereitete `send_email`-Binding ist noch keine Freischaltung. Ein
Produktionsupload mit diesem Binding kann an fehlenden Berechtigungen oder
unverifizierten Adressen scheitern. Nicht ungeprüft deployen.

## Vor Aktivierung zu erledigen

### 1. Empfang und Antworten einrichten

Der Nutzer meldete die Mailadresse als eingerichtet und hat anschließend den
Cloudflare-Link selbst bestätigt. Die API weist die Destination seit 16. Oktober, 13:50:15 UTC als verifiziert aus (lesend bestätigt am 18. Oktober).
Keine erneute Verifikationsmail angefordert und keine Mailbox/DNS-Daten verändert.
Anschließend hat der Nutzer auch beide tatsächlichen Formularzustellungen und
den Antworttest unter der neuen Identität bestätigt. Damit sind diese
Funktions-/Empfangsprüfungen bestanden; eine Produktivumschaltung oder Änderung
der veröffentlichten Adresse benötigt weiterhin eine gesonderte Freigabe.

- Beim bestehenden Mailanbieter einen Alias oder eine Weiterleitung von
  `kontakt@petruskirche.events` zum bisherigen zuständigen Postfach einrichten.
  Die konkreten Möglichkeiten hängen vom Mailvertrag ab.
- `konzerte@akg-kiel.de` weiter empfangsbereit lassen.
- Empfang von außen sowie Antworten unter der neuen Adresse prüfen. Eine
  Weiterleitung allein richtet nicht automatisch den Versand unter dieser
  Adresse im Mailprogramm ein.
- Schleifen zwischen alter und neuer Weiterleitung ausschließen.
- Erst nach erfolgreichem Empfangs-/Antworttest `CONTACT_EMAIL` auf die neue
  Adresse ändern. Das kann unabhängig vom direkten Webversand geschehen.

**Keine bestehenden IONOS-MX- oder SPF-Einträge entfernen.** Die neue öffentliche
Kontaktadresse bleibt beim bestehenden Mailanbieter. Nur die getrennte
Absender-Subdomain nutzt Cloudflare Email Routing.

### 2. Festen Empfänger und nativen Worker-Versand abnehmen

Der gewählte Weg verwendet kostenloses Routing auf der getrennten Absender-
Subdomain und ein natives `send_email`-Binding an eine verifizierte Destination.
Die einzelne native Testzustellung ist oben dokumentiert. Das allgemeine
**Email Sending**-Dashboard verlangt in diesem Konto Workers Paid; es wird für
diesen Weg nicht freigeschaltet. Die frühere Kostenprognose ohne Unterscheidung
dieser Einrichtungswege war zu pauschal.

- `kontakt@petruskirche.events` ist als Destination bestätigt; tatsächliche
  Formularzustellung und Antworten über diese neue Adresse sind inzwischen
  ebenfalls vom Nutzer bestätigt.
- `CONTACT_RECIPIENT` und `MAILER.destination_address` müssen auf dieselbe feste
  Produktivadresse zeigen; die Testadresse nur in einer ausdrücklich isolierten
  Testkonfiguration nutzen.
  Keine vom Besucher wählbaren Empfänger oder offenen Relays hinzufügen.
- Der Anwendungscode verwendet den strukturierten nativen Builder. Anders als
  die erste `EmailMessage`-Einzeltestmail wurden inzwischen auch beide vollständigen
  Formularpfade mit echtem Binding und Turnstile durch den Nutzer erfolgreich
  getestet. Die neue Zieladresse wurde danach ebenfalls funktional abgenommen;
  die Hauptdomain bleibt vor der freigegebenen Aktivierung separat zu prüfen.
- Empfang, Reply-To und tatsächliche Authentifizierungsheader des gewählten
  Anwendungspfads prüfen; ein Domainstatus `ready` oder eine SMTP-Annahme ersetzt
  keine DKIM-/DMARC-/Spamordnerprüfung.
- Keine Änderung an bestehenden IONOS-MX/SPF-, DKIM- oder DMARC-Regeln vornehmen,
  um Cloudflare-Hinweise für die Hauptdomain zu beheben.
- Laut Cloudflare sind Sendungen an verifizierte Destinationen auf allen Plänen
  kostenlos. Allgemeiner Versand an beliebige Empfänger benötigt Workers Paid.
  **Keine automatische Besucherbestätigung und kein kostenpflichtiges Upgrade
  ohne ausdrückliche Zustimmung.**

### 3. Turnstile einrichten

- Ein Managed-Widget ohne Pre-clearance für die bestätigte Website einrichten;
  Domains und Zielkonto vorher bestätigen. Keine automatische Widget-Erstellung
  oder Secret-Rotation durch diese Vorbereitung.
- Der Nutzer hat den öffentlichen Sitekey bereitgestellt; er steht in
  `TURNSTILE_SITE_KEY` und darf im Formular-HTML stehen. `TURNSTILE_SECRET`
  ausschließlich im privaten Secret Store des bestehenden Workers hinterlegen,
  nicht in Quellcode, Chat, Befehlsargumenten oder Protokollen. Bei manueller
  Dashboard-Einrichtung nur Typ Secret und Namen `TURNSTILE_SECRET` verwenden;
  bestehende Secrets, insbesondere ChurchTools, nicht ersetzen. Das Dashboard
  kann hierfür ein Secret-Konfigurationsdeployment verlangen; dies ist vom
  späteren Upload/Aktivieren des noch lokalen Formularcodes zu unterscheiden.
- `TURNSTILE_HOSTNAMES = "petruskirche.events"` bleibt die Produktionsliste.
  Lokale oder gesonderte Vorschauprüfungen brauchen eine eigene passende
  Konfiguration. Niemals localhost pauschal zur Produktionsliste hinzufügen.
- Die zwei Frontend-Aktionen sind `contact` und `booking`. Der Handler verlangt
  dieselbe Aktion und den exakten anfragenden Host aus der erlaubten Liste.
- Lokale Entwicklung behält `remote = false`. Offline- und Browserprüfungen
  simulieren Mailer und Turnstile. Nur die ausdrücklich genehmigte einmalige
  Maildiagnose nutzte ein echtes Remote-Binding; diese Sitzung ist beendet.
  Keine echten Nachrichten bei normalen Entwicklungs-/Qualitätsprüfungen senden.

### 4. Datenschutz freigeben

Die bedingten Texte in `src/pages/datenschutz.astro` sind ein technischer
Textentwurf, **keine rechtliche Freigabe**. Vor Aktivierung im Rahmen von AKG-113
insbesondere prüfen:

- kirchliche Rechtsgrundlage und nötige Hinweise/Einwilligungen für Turnstile;
- Auftragsverarbeitung, Datenempfänger, Drittlandübermittlungen und Garantien;
- Speicher-/Löschfristen beim Mailanbieter und bei Cloudflare, einschließlich
  technischer Protokolle und nicht zustellbarer Nachrichten;
- die bereits bestehende Aussage zur Löschung binnen zehn Tagen. Sie wurde hier
  nicht als tatsächlicher Betreiberprozess bestätigt.

Nach Aktivierung darf die Datenschutzerklärung nicht mehr behaupten, das
Formular öffne lediglich ein Mailprogramm oder verarbeite keine Daten auf dem
Server. Die vorbereitete Umschaltung berücksichtigt dies.

### 5. Bewusst aktivieren und abnehmen

Nach den vorherigen Freigaben in der Quellkonfiguration setzen:

```toml
[vars]
CONTACT_EMAIL = "kontakt@petruskirche.events"
CONTACT_RECIPIENT = "kontakt@petruskirche.events"
CONTACT_FORMS_ENABLED = "true"
TURNSTILE_SITE_KEY = "<öffentlicher Sitekey>"
TURNSTILE_HOSTNAMES = "petruskirche.events"
```

Die übrigen Variablen und Bindings, insbesondere ChurchTools, `ASSETS`, `IMAGES`,
`workers_dev = false`, `preview_urls = true` und Prelaunch-`noindex`, erhalten.
Secret-Vorhandensein am exakten Worker/Ziel prüfen, ohne Werte auszulesen.
Build und Qualitätsprüfung durchführen. Merge und Veröffentlichung brauchen
jeweils eine gesonderte Freigabe; diese Vorbereitung erteilt keine davon.

Anschließend mit **ausdrücklich genehmigten Testnachrichten** beide Formulare
auf einer passenden Vorschau und danach auf der Hauptdomain abnehmen:

- tatsächliche Zustellung im neuen Postfach, richtiger Absender und Reply-To;
- eine echte erfolgreiche Turnstile-Prüfung und abgewiesene Token-Wiederholung;
- ungültige/abgelaufene Tokens, falscher Host/falsche Aktion und Dienstfehler
  ohne Versand;
- Pflichtfelder, lange und mehrsprachige Eingaben, fehlende Verbindung,
  Mehrfachklicks sowie erhaltene Wunsch-/Alternativdaten nach Fehlern;
- Erfolg, Fehler und Tastaturfokus auf Desktop und Mobil;
- Verhalten ohne JavaScript: direkter Versand ist dann nicht verfügbar, ein
  ausdrücklicher E-Mail-Link bleibt als Alternative bestehen;
- neue öffentliche Adresse in Kontaktseite, Footer und Konzertkontakt im
  Impressum; allgemeine Gemeinde-/Datenschutzadressen unverändert;
- kein versehentliches Google-Maps-Laden oder Aufheben des `noindex`.

Ein API-Erfolg bedeutet **Annahme zum Versand**, nicht garantierte Zustellung.
Netzwerk- oder Bestätigungsfehler können trotz Annahme auftreten. Es gibt deshalb
keine automatische Wiederholung; vor erneutem Absenden Eingang prüfen.
Eingaben bleiben während der Übermittlung und bei Fehlern erhalten, einschließlich
beider Kalenderwerte. Nach ausdrücklich bestätigter Versandannahme wird das
komplette Formular einschließlich Wunsch-/Alternativdatum und Kalenderauswahl
geleert. Ein modelloses, auf die umgebende Formularkarte begrenztes Overlay
bestätigt die Übergabe mit der goldenen Siegel-/Hakenanimation; bei reduzierter
Bewegung bleibt das Symbol statisch. Die übrige Seite wird weder abgedunkelt
noch gesperrt; nur die überlagerten Formularfelder bleiben inaktiv. Der Fokus
startet bei der Bestätigung, wird aber nicht eingefangen. Escape innerhalb der
Bestätigung und Schließen führen zum leeren Formular zurück. Auch bei langen
Raumanfragen wird die Bestätigung in den sichtbaren Bereich gebracht. Keine automatische Wiederholung oder
zeitgesteuerte Schließung. Die Anwendung legt keine Anfragen-Datenbank an und
protokolliert keine Formulardaten oder unverarbeiteten Providerfehler.
Die E-Mail-Prüfung akzeptiert eine einzelne unquotierte ASCII-Mailbox, keine
Adresslisten oder Anzeigenamen; internationale Mailboxnamen sind nicht unterstützt.

Bei Problemen direkten Versand wieder deaktivieren und neu bauen/veröffentlichen.
Die neue öffentliche Adresse nur dann auf die alte zurückstellen, wenn auch der
neue Empfang nicht zuverlässig funktioniert. DNS oder Postfächer nicht löschen.

## Lokale Prüfungen ohne echten Versand

```sh
pnpm test
pnpm quality
node --experimental-strip-types scripts/check-contact-mail.mjs
```

Der Offlinecheck ersetzt Mailer und Siteverify durch synthetische Mocks und
blockiert echten Netzwerkzugriff. Für die Browserabnahme wird ausschließlich
in einer isolierten lokalen Kopie die aktive Konfiguration mit synthetischem
Sitekey gebaut. Ein Browserstub ersetzt Turnstile und die Formularantworten.
Das ist Funktions-/Fehlerprüfung, kein Beleg realer Mailzustellung oder echter
Turnstile-Validierung. Die Produktionskonfiguration bleibt ausgeschaltet.

Der optionale Browsercheck für eine solche aktive lokale Testkopie blockiert
alle echten Formular-POSTs und ersetzt Turnstile sowie den Versand:

```sh
CHROME_BIN=/path/to/chromium node scripts/check-contact-forms.mjs --origin=http://127.0.0.1:4321
```

Er prüft beide Formulare, Daten-/Datumsreset nur nach Annahme, Werteerhalt bei
Fehlern, Mehrfachklickschutz, nativen Dialogfokus/Escape und reduzierte Bewegung.
Die Browserprüfung akzeptiert ausschließlich Loopback-Ziele.

## Prüfstand der Vorbereitung

`pnpm quality`, der Offline-Sicherheitscheck und die bestehende Programmnavigation
(320–1920 px) bestanden. Die Mail-Frontendabläufe wurden mit synthetischen
Turnstile-/API-Antworten in beiden Modi bei 320/375/768/1280 px geprüft:
Pflichtfelder, Fehler und Annahme, ausstehende Antwort/Mehrfachversuche,
Token-Ablauf, Scriptfehler, unabhängige Datumswerte, Tastaturfokus und
No-JS-Alternative. Diese Formularprüfungen erzeugten keine echten E-Mails oder
Siteverify-Anfragen. Der spätere isolierte native Mailtest, die echten
Siteverify-Negativprüfungen und die vom Nutzer bestätigten Formularzustellungen
sind oben ausdrücklich davon getrennt.

Der anschließend gewünschte Erfolgsdialog wurde bei 375 und 1280 px mit
normaler und reduzierter Bewegung geprüft: ausschließlich bestätigte Annahme
leert alle Felder und die vor Hydration übernommenen Kalenderdaten. Pending,
Providerfehler und Netzwerkunsicherheit behalten alles; auch die nicht-nativen
Datumssegmente und Kalenderzellen sind während des Versands mittels `inert`
gesperrt. Native Fokusführung, Escape/Schließen, ein zweiter Versand und
Kalender-Neurender nach Reset bestanden. Der abschließende Durchlauf umfasste
24 abgefangene synthetische POSTs und erzeugte keine echte Nachricht. Der
unabhängig gefundene Pending-Datumseingabe-Befund wurde behoben und nachgeprüft.
Nur der bestehende Vorschau-Alias wurde aktualisiert, nicht der Produktiv-Traffic.
Nach Nutzerpräzisierung liegt das Overlay ausschließlich auf der Formularkarte:
Begrenzung am Container, normale Seiteninteraktion und Scrollbarkeit außerhalb,
Fokus ohne Falle sowie alle 24 simulierten Versandfälle bei 375/1280 px erneut
geprüft. Animation, Vollreset und Fehler-Werteerhalt bleiben unverändert.

**Separater bestehender Mobilfehler:** Der viewportbreite Belegungskalender wird
bei 375 px vom Kartenrand abgeschnitten; Monatssteuerung und Randspalten sind
teilweise verdeckt. Das tritt in beiden Modi auf und betrifft die unveränderte
Calendar/Card-Kombination. Datumsfelder und Tastaturbedienung bleiben möglich.
Der Befund gehört zu AKG-103 und wurde nicht durch einen Kalenderumbau in diese
Mailvorbereitung aufgenommen. Die Prüfung ist keine mobile Gesamtfreigabe oder
vollständige Barrierefreiheitsabnahme.

## Maßgebliche Dokumentation

- [Cloudflare Email Service](https://developers.cloudflare.com/email-service/)
- [Domainkonfiguration](https://developers.cloudflare.com/email-service/configuration/domains/)
- [Preise](https://developers.cloudflare.com/email-service/platform/pricing/)
- [Workers-Sende-API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)
- [Turnstile serverseitig prüfen](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
