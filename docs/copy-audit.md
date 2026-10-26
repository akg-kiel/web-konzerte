# Copy audit – AKG-42 / AKG-82 / AKG-87 / AKG-113

## Scope reviewed

Rendered baseline reviewed on `https://web-konzerte.noah-zepner.workers.dev/` on 2026-10-05, plus source review in this checkout:

- `/`
- `/programm/`
- `/programm/archiv/`
- `/programm/das-bruckenkonzert-2026-49975-2026-09-26/`
- `/programm/konzert-felix-rauber-49090-2026-10-03/` (corrected representative no-ticket route; rendered as a past/archived concert on the current date)
- `/besuch-planen/`
- `/raum-anfragen/` (source-reviewed redirect to `/für-veranstalter/`; rendered baseline returned Astro redirect copy)
- `/für-veranstalter/`
- `/kontakt/`
- `/impressum/`
- `/datenschutz/`
- shared header, footer, concert cards/lists, filters, availability calendar, map consent, contact/room-request forms, empty/error copy in source

Not independently passed: canonical production domain `https://konzerte-petruskirche.de/` currently fails DNS resolution, so domain-based validators/canonical-live checks must remain provisional.

## Implemented in owned/shared copy files

- Homepage title now uses the AKG-82 wording: `Konzerte in Kiel | Petruskirche – Kiels Konzertkirche`.
- Homepage description, hero intro and primary CTA now include `Konzerte in Kiel` naturally without stuffing.
- Homepage supporting copy was tightened: less generic acoustics wording, clearer visitor/event planning heading, clearer room-request CTA.
- Header/footer navigation now uses `Raum anfragen` instead of mixed `Für Veranstalter` wording; mobile ticket note now says tickets are bought through each event's provider.
- Home concert section label now reads `Nächste Konzerte in Kiel`.
- Visit page intro, admission copy, parking wording and wheelchair-place note were shortened and made more direct.
- Room-request page now has matching title/H1 (`Raum anfragen`), tighter download/form helper copy and a plain `Technische Anforderungen und Bemerkungen` form label.
- Contact metadata typo fixed: `Nachrichtenformular`.
- Availability calendar helper/status copy now says the check is an unverbindliche Vorprüfung and the final confirmation follows the request.

No legal substance was changed in the 2026-10-05 copy pass. The later DSG-EKD preliminary revision is documented separately below and is not a legal approval.

## Programme landing integration (AKG-87)

Parent integrated the following programme copy after the SEO owner released the file:

- Title: `Konzerte in Kiel | Programm der Petruskirche`
- Description: `Aktuelle Konzerte in Kiel: Programm der Petruskirche mit Klassik, Chor, Musical, Orgel und Crossover sowie Ticketlinks, sobald der Vorverkauf startet.`
- Eyebrow: `Konzertprogramm`
- H1: `Konzerte in Kiel`
- Intro (AKG-118, clarified feedback): `Klassik, Chor, Musical und Crossover – Konzerte in der Petruskirche.` Replaces the old explanation of sorting, detail pages and ticket links; the shared heading applies to both current concerts and the archive.
- Concerts section heading/eyebrow: `Alle Konzerte`
- Venue/access link text: `Besuch planen →` instead of `Besucherinformationen →`

Rationale: the central landing page keeps its own title/H1; existing cards provide the concert details. AKG-118 removes season filtering and rewrites the introduction around the existing programme genres. Following clarified feedback and Mobbin research, `Aktuelle Konzerte` / `Konzertarchiv` form a quiet, underlined route navigation above search on both pages, not a prominent hero CTA. Both routes now share one heading/search wrapper rather than changing hero height, container padding and search headings on selection. The two initial result views are server-prepared and switched locally while fresh, without fetching HTML or replacing the body/search form. The shared GET form uses native fields rather than a hydrated island. Astro's router still owns history and metadata; searches, pagination, expired data and failures retain the server path. The selected link keeps focus and the viewport keeps its scroll position. Real links and `aria-current="page"` retain direct URLs and the no-JavaScript fallback. Other sections do not opt into the router. Reference: [Unity events](https://mobbin.com/screens/0d59fbdc-b2d3-4530-bced-188f1d5a4881), with current/recorded navigation above its filters. Text/date search remains unchanged.

## Programme/detail wording proposals for parent / programme owner

Do not hard-code ChurchTools event data in the repo; correct the source fields in ChurchTools.

- `/programm/[slug].astro` metadata currently creates descriptions like `Titel am Datum – Ort.`. For event pages without real description, keep this simple; do not append placeholder programme fields.
- No-ticket/past button state is okay, but the corrected Felix route rendered as `Vergangenes Konzert` on 2026-10-05. If the acceptance still needs an upcoming no-ticket state, pick a future event without a `ticketUrl` from current ChurchTools data.
- Parent changed the upcoming detail back link from `Alle Konzerte` to `Zum Programm`; the past state remains `Konzertarchiv`. Temporary CT failures now have matching unavailable-page metadata rather than a not-found description.
- The archive contains imported title issues that should be fixed in ChurchTools, not in code:
  - `Ronnefeld Preis_Theater iel` → likely typo in title field (`Preis_`, `iel`).
  - `Italian Giuseppe Verdi String Orchestra` → confirm intended German/English naming.
  - `EZ Event - QUARTETT - QUEEN & ABBA (Streichquartett)` / `AZ Event - ...` → confirm whether organiser prefixes belong in public titles.
  - `Akademisches Orchester UNI Kiel` → prefer official casing (`Universität Kiel` or confirmed `Uni Kiel`).

## ChurchTools-owned corrections found

Rendered placeholder content on `/programm/das-bruckenkonzert-2026-49975-2026-09-26/` must be corrected in ChurchTools appointment fields:

- `appointment.description` / metadata field `Einlass`: `[HH:MM Uhr]`
- `appointment.description` / metadata field `Kurzbeschreibung`: `[Kurzer Vorschautext für die Konzertübersicht]`
- `appointment.description` / metadata field `Langbeschreibung` or `Programmhinweise`: `[Ausführliche Beschreibung des Konzerts und des Programms. Mehrere Absätze sind möglich.]`
- `appointment.description` / metadata field `Mitwirkende`: `[Namen des Ensembles oder der Mitwirkenden]`
- `appointment.image.description` if the poster/image has meaningful content beyond the generic fallback alt.

General ChurchTools guidance: keep event titles, subtitles, programme notes, performers, admission, accessibility, ticket links and image descriptions in ChurchTools as the source of truth.

## Factual confirmations / blockers

These claims were source-reviewed but not externally verified in this implementation pass. Confirm before launch or keep them marked as provisional:

- Accessibility: ramp, no steps in the nave, wheelchair-accessible WC in the adjacent Gemeindehaus, wheelchair places.
- Visitor operations: usual 45-minute admission, Abendkasse opening with admission, recommendation for cashless payment.
- Transport/parking: bus lines 6, 32, 91 and limited free street parking.
- Contact details: `konzerte@akg-kiel.de`, `kontakt@akg-kiel.de`, `website@akg-kiel.de`, phone numbers and named contact person.
- Room-request facts: capacities, optional additional seats, stage/FOH/monitoring/light details, required/secondary ChurchTools resources behind the availability pre-check.
- Legal pages: any substantive privacy/imprint assessment needs qualified approval; this audit treated them as editorial/source-alignment only.

## Parent verification

- Corrected the incumbent/newly repeated “neugotische Architektur” and unsupported “hohe Gewölbe” wording in homepage/hero/alt text. The official church page identifies the building as a Jugendstilkirche and describes its open roof structure and timber construction: https://akg-kiel.de/petruskirche (checked 2026-10-05).
- A search-provider answer suggested specific Bundeswehrplatz parking hours, but neither the current full readable page nor its raw HTML contained those claims. They were not accepted as verified parking facts or added to the website.
- Current deployed AKG-112 detail rendering was confirmed with native Chromium at 1280, 768, 375 and 430 viewport widths, with the checked deployment URL recorded. The Felix Räuber fixture is now past; its action correctly reads “Aktuelle Konzerte”. The integrated built Worker was subsequently checked on desktop/mobile across all main routes; poster details also passed four viewport widths. Preview HTTP/canonical/indexing and a deployed homepage snapshot passed separately. See [seo/validation.md](seo/validation.md) for the exact boundaries; production-domain and factual-owner checks remain pending.

- The browser check also found two low-contrast empty year segments in the room-request date fields (about 4.36:1). Parent raised the shared placeholder opacity from 50% to 60%; the confirmation round had no contrast-detector failures.

## Terminology decisions

- Primary public action for hiring the venue: `Raum anfragen`.
- Visitor programme language: `Konzerte in Kiel`, `Programm`, `Konzertprogramm`, `Konzertarchiv`.
- Form of address remains formal `Sie/Ihr`.
- AKG-85: `Die Petruskirche – Kiels Konzertkirche` is the preferred public brand wording; the compact site name is `Petruskirche – Kiels Konzertkirche`. Homepage location copy, the contact/about section, footer, Open Graph site name and WebSite JSON-LD use it consistently. `Petruskirche Kiel` remains appropriate for addresses and factual event locations; existing page-specific titles are not replaced with a repeated slogan.
- External profile changes and partner communication remain separately tracked in AKG-105/100; this copy change neither updates nor claims to have reviewed external accounts. Search intents and page ownership: [SEO keyword set](seo/keywords.md).

## DSG-EKD-Vorprüfung (AKG-113)

**Stand: 22. Oktober 2026. Fachlicher Textentwurf, keine Rechtsfreigabe.**
Auf Nutzerwunsch wurden die Rechtstexte gegen geltendes DSG-EKD, öffentliche
Primärquellen und den Anwendungscode auf Basis von `ee7a0e6` geprüft und
bestmöglich vorbereitet. Nicht geprüft wurden private Verträge, interne
Bestellungen/Beschlüsse, Providerkonten oder tatsächliche Löschvorgänge.
Die Vorprüfung änderte keine Dienste, DNS, Geheimnisse, Formulare oder
Einwilligungsabläufe und löste weder Versand noch Indexierungswechsel aus.
Der Nutzer hat anschließend den Merge der Textkorrekturen ausdrücklich
beauftragt. Merge und Veröffentlichung sind keine rechtliche Betreiberfreigabe.

### Bereits im Entwurf korrigiert

- Keine pauschale ergänzende Geltung der DSGVO behauptet. Maßgeblich sind für
  die Gemeinde DSG-EKD und einschlägige kirchliche Bestimmungen.
- Hosting als Cloudflare-Workers-Angebot mit vorbereiteten **und dynamischen**
  Antworten beschrieben, nicht als rein statische Website.
- Die Aussage „keine eigenen Anwendungsprotokolle“ entfernt: Konzert- und
  Verfügbarkeitscode erzeugt technische Fehlermeldungen. Der Formularcode
  protokolliert keine Nachrichteninhalte. Keine unbekannte Provider-Logfrist
  als feste Frist ausgegeben.
- ChurchTools-Abrufe, Kalenderzeiträume, Belegungszustände und Originalplakat-
  Links beschrieben. Die Datenabfragen übertragen keine Namen, E-Mail-Adressen
  oder Nachrichtentexte aus Formularen an ChurchTools. Ein direkter
  Originalplakat-Aufruf verbindet den Browser dagegen mit ChurchTools.
- Direkten Formularversand durch Worker und Cloudflare Email Service vom
  deaktivierten Mailprogramm-Fallback unterschieden. Cloudflare verarbeitet
  beim Mailversand auch Formularinhalte; eine Turnstile-Aussage über bloße
  Prüfsignale darf nicht auf den gesamten Maildienst übertragen werden.
- IONOS als bestehenden Empfänger-Maildienst und Speicherung von Nachrichten/
  Korrespondenz im Postfach ergänzt. „Kein eigenes Anfragearchiv“ ist keine
  Aussage über fehlende E-Mail-Kopien, Warteschlangen oder Sicherungen.
- Freiwilligkeit, tatsächliche Formularpflichtfelder, optionale Angaben und
  Folgen fehlender Angaben erläutert. Die Pflichtfelder sind technische
  Versandvoraussetzungen, keine Pflicht zur Kontaktaufnahme.
- Turnstiles automatischen Start beim JavaScript-Seitenaufruf und die vom
  Anbieter genannten Signale ergänzt. Cloudflares eigene Verantwortlichkeit
  für die Verbesserung der Bot-Erkennung ausdrücklich vom Schutz der Website
  als Dienstleistung unterschieden; spezifisches Privacy Addendum verlinkt.
- Keine automatische Entscheidung über eine Buchung behauptet; automatische
  Spamprüfung kann den Direktversand verhindern, E-Mail bleibt eine Alternative.
  Das ist keine abschließende rechtliche Einordnung nach § 25a DSG-EKD.
- Die unbelegte Zehn-Tage-Löschzusage entfernt. Statt einer erfundenen Ersatzfrist
  nennt der Entwurf Zweckfortbestand, Vertragsabwicklung, rechtliche Ansprüche
  und gesetzliche Aufbewahrungspflichten als Kriterien. **Kein Nachweis**, dass
  diese Kriterien bereits als interner Löschprozess umgesetzt sind.
- Keine kontospezifisch unbewiesene DPF-/SCC-Garantie mehr erklärt. Mögliche
  USA-Verarbeitung, § 10 DSG-EKD und Anbieterinformationen bleiben benannt.
  Ein Link auf ein DPA beweist keinen passenden abgeschlossenen Vertrag.
- Maps-Einwilligung nach § 6 Nr. 2 i. V. m. § 11 DSG-EKD zugeordnet; § 25
  TDDDG für Endgerätezugriffe berücksichtigt. Die Auswahl wird nicht
  seitenübergreifend gespeichert. Neuladen stoppt die weitere Einbindung,
  löscht aber keine bereits bei Google entstandenen Daten oder Cookies.
- Rechte mit §§ 19–25, Widerruf mit § 11 Abs. 3 und Beschwerde mit § 46 DSG-EKD
  präzisiert. Datenübertragbarkeit und Widerspruch nicht voraussetzungslos zugesagt.
- Rechtsform „Körperschaft des öffentlichen Rechts“ ergänzt. Das
  Vertretungsorgan ist nach Art. 28 Nordkirchenverfassung der Kirchengemeinderat,
  nicht Pastor Grabbet allein. Gemeinsame Vertretung durch zwei Mitglieder
  beschrieben; Pastor Grabbet nur als im Gemeinde-Impressum benannten Kontakt
  aufgeführt. Keine aktuelle interne Wahlbestätigung unterstellt und keine
  zweite Person erfunden.

### Entwurfszuordnung der Rechtsgrundlagen

Diese Zuordnung ist ein **Prüfvorschlag**, keine dokumentierte
Interessenabwägung oder Entscheidung der verantwortlichen Stelle:

| Verarbeitung                                                                                                       | Im Text vorgesehene Grundlage                      | Noch zu bestätigen                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Technische Bereitstellung, dynamische Abfragen, Betrieb/Sicherheit                                                 | § 6 Nr. 4 DSG-EKD                                  | Erforderlichkeit, Datenumfang, Fristen und Interessenabwägung; gegebenenfalls einschlägigere Aufgabengrundlage nach Nr. 3                                                     |
| Allgemeine Kontaktbearbeitung, auch Kontaktpersonen von Organisationen                                             | § 6 Nr. 4 DSG-EKD                                  | Erforderlichkeit und Interessenabwägung                                                                                                                                       |
| Erforderliche Verarbeitung für Vertrag mit der betroffenen Person bzw. vorvertragliche Maßnahmen auf deren Anfrage | § 6 Nr. 5 DSG-EKD                                  | Tatsächliche Vertragspartei; nicht pauschal jede Veranstaltungs-/Organisationsanfrage darunter fassen                                                                         |
| Von der Gemeinde veranlasster Turnstile-Formularschutz                                                             | § 6 Nr. 4 DSG-EKD als Entwurfsansatz               | Zulässigkeit einschließlich Offenlegung, Anbieter-Eigenzweck und Endgerätezugriff **offen**; Cloudflares eigene Interessenbegründung ersetzt nicht die Grundlage der Gemeinde |
| Optionale Maps-Einbindung                                                                                          | § 6 Nr. 2 i. V. m. § 11 DSG-EKD; § 25 Abs. 1 TDDDG | Informierte Einwilligung, Nachweis und gleich einfacher Widerruf; zusätzlicher Drittlandmechanismus                                                                           |

### Vor fachlicher Freigabe zu entscheiden bzw. nachzuweisen

1. **Verantwortlichkeit und Anbieterkennzeichnung:** aktuelle Gemeinde-/KGR-
   Angaben und ausreichend konkrete personenmäßige Vertretungsangaben bestätigen.
   Umsatzsteuer-/Wirtschafts-ID nur ergänzen, falls tatsächlich vorhanden und
   erforderlich; eine etwaige redaktionelle Verantwortlichkeit nach Medienrecht
   gesondert beurteilen, nicht aus der technischen Kontaktadresse ableiten.
2. **Datenschutzkontakt:** Das Gemeinde-Impressum nennt Michael G. Schmidt
   ausdrücklich als örtlich Beauftragten; der Kirchenkreis nennt ihn
   ausgeschrieben Michael Georg Schmidt. Ein gemeindespezifischer öffentlicher
   Beleg liegt damit vor. Aktuelle interne Bestellung/Zuständigkeit und
   Kontaktangaben durch Gemeinde/Kirchenkreis bestätigen lassen.
3. **Auftragsverarbeitung und Rollen:** tatsächliche Vertragspartner,
   einbezogene AV-Verträge, Weisungen, technische/organisatorische Maßnahmen,
   Kontrollrechte und Unterauftragnehmer für Cloudflare, ChurchTools und
   Maildienst feststellen. Turnstiles Anbieter-Eigenzweck gesondert einordnen.
   Aktueller § 30 Abs. 5 erlaubt für nicht dem Kirchenrecht unterliegende
   Auftragsverarbeiter Vertragsinhalte in Orientierung an Art. 28 DSGVO.
   Daraus folgt weder eine allgemeine Unterwerfungspflicht aus diesem Absatz
   noch eine pauschale Freigabe jedes Anbieter-DPA. Nordkirchen-DSDVO § 8
   (Anzeige auf Verlangen) und gegebenenfalls verbindliche Muster beachten.
4. **Drittlandübermittlungen:** tatsächliche Empfänger einschließlich
   Unterauftragnehmer, Verarbeitungs-/Zugriffsländer und konkrete Grundlage nach
   § 10 dokumentieren. Bei DPF müssen aktuelle Empfängergesellschaft,
   Zertifikatsstatus und passende Datenkategorie nachgewiesen sein. SCC nicht
   allein wegen einer Anbieter-Webseite als wirksam vereinbart darstellen.
   Maps-Bestätigung nicht als pauschale ausdrückliche Risiko-Einwilligung nach
   § 10 Abs. 2 Nr. 1 umdeuten.
5. **Turnstile/Endgeräte:** tatsächliche Signale, Speicher-/Zugriffsvorgänge und
   Erforderlichkeit nach § 25 TDDDG bewerten. Managed-Modus bzw. fehlendes
   Pre-Clearance beweisen keine Einwilligungsfreiheit. Automatisches Laden und
   eigener Verbesserungszweck bleiben klärungsbedürftig; ein möglicherweise
   nötiger technischer Zustimmungsablauf wird durch diese Textkorrektur
   **nicht** ersetzt. Auch die Relevanz von § 25a gesondert beurteilen.
6. **Löschkonzept:** praktikable Fristen und Zuständigkeiten für Anfragen,
   Antworten, Vertragsunterlagen, lokale Kopien, Exporte, Sicherungen,
   Cloudflare-Übermittlungswarteschlangen sowie Betriebs-/Sicherheitsprotokolle
   feststellen und dann den öffentlichen Text konkretisieren. Die kurze
   Gültigkeit eines Turnstile-Tokens ist keine belegte Datenlöschfrist.
7. **Maps:** Inhalt vor dem Bestätigungsschritt, Nachweis nach § 11 Abs. 1
   und Widerruf nach Abs. 3 prüfen. Der jetzige Code speichert keinen
   dauerhaften Zustimmungsnachweis und bietet nach dem Laden keinen eigenen
   Entladen-Schalter. Neuladen ist das beobachtete Verhalten, keine bestätigte
   rechtliche Bewertung der Widerrufslösung.
8. **Konzert-/Porträtinhalte:** Rechtsgrundlagen für Veröffentlichung von
   Mitwirkenden und Fotos, Bildrechte sowie gegebenenfalls Informationspflichten
   bei mittelbarer Erhebung nach § 18 DSG-EKD gesondert prüfen. Öffentlich
   abrufbare ChurchTools-Daten sind kein pauschaler Einwilligungsnachweis.

### Informationspflichten und Quellen

§ 17 DSG-EKD verlangt zum Erhebungszeitpunkt unter anderem Verantwortlichen,
Datenschutzkontakt, Zwecke/Grundlagen, Empfänger, Dauer bzw. Kriterien, Rechte,
Beschwerdemöglichkeit, Angaben zur Bereitstellung und gegebenenfalls erhebliche
automatisierte Entscheidungen. Diese Vorprüfung verbessert die Information,
erledigt aber die oben fehlenden Tatsachen und Entscheidungen **nicht**.
Die fortbestehende, ausdrücklich genehmigte Formularoperation ist keine
qualifizierte Rechtsfreigabe; AKG-113 bleibt offen.

Primärquellen, abgerufen am 22. Oktober 2026:

- [DSG-EKD, geltende konsolidierte Fassung](https://www.kirchenrecht-ekd.de/document/58309),
  Neufassung vom 15. Januar 2025, ausgewiesene Berichtigung vom 20. Februar 2025:
  insbesondere §§ 2, 5, 6, 10, 11, 16–25a, 30, 36, 38 und 46.
- [Nordkirchenverfassung](https://www.kirchenrecht-nordkirche.de/document/24017),
  Art. 4 Abs. 1 und Art. 28; [DSDVO](https://www.kirchenrecht-nordkirche.de/document/37671),
  insbesondere §§ 8, 12 und 13.
- [Gemeinde-Impressum](https://akg-kiel.de/impressum) für Gemeindeanschrift,
  Vorsitz und örtlichen Datenschutzkontakt, **nicht** als rechtliches Muster:
  die dortigen TDG-/MDStV-Verweise und Disclaimer wurden nicht übernommen.
- [Datenschutzkontakt des Kirchenkreises](https://www.kirchenkreis-altholstein.de/datenschutz)
  und [Struktur der EKD-Datenschutzaufsicht](https://datenschutz.ekd.de/ueber-uns/unsere-struktur/).
- [BfD-EKD-FAQ zum DPF](https://datenschutz.ekd.de/infothek-items/haeufig-gestellte-fragen-zum-dpf/):
  Zertifizierung ersetzt weder Verarbeitungsgrundlage noch Anforderungen an AV.
- [Turnstile Privacy Addendum](https://www.cloudflare.com/turnstile-privacy-policy/),
  Stand 18. Juni 2025, Abschnitte 3–5: Signale, Auftragsverarbeitung und eigener
  Verbesserungszweck; [Cloudflare-DPA](https://www.cloudflare.com/cloudflare-customer-dpa/)
  als Anbieterinformation, nicht Nachweis unserer konkreten Vertragslage.
- [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html) und
  [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html).
- [Google-Datenschutzerklärung](https://policies.google.com/privacy?hl=de) und
  [ChurchTools-Datenschutzhinweise](https://www.church.tools/datenschutz).

Technische Belege: `src/data/concerts.ts`, `src/data/concert-images.ts`,
`src/pages/api/availability.ts`, `src/lib/contact-mail.ts`,
`src/components/sections/{MailForm,MapConsent}.astro`, die Formularseiten,
`astro.config.mjs`, `wrangler.toml` und die dokumentierte Mail-Inbetriebnahme
in [email-forms.md](email-forms.md). Keine Geheimniswerte ausgelesen.

### Technische Validierung dieses Arbeitsstands

- Der erweiterte Build-Check schlug gegen den alten HTML-Stand erwartungsgemäß
  wegen des fehlenden spezifischen Turnstile-Hinweises fehl; nach Überarbeitung
  bestanden die Build-Guards einschließlich Aktivierungs-/Noindex-Abgleich.
- `pnpm quality` bestanden: Offline-Regressionen, Format/Lint, generierte Typen,
  Astro-Prüfung ohne Fehler/Warnungen und vollständiger Build samt SEO-Checks.
- Beide gebauten Rechtstextseiten bei 320, 375 und 1280 CSS-Pixeln geprüft:
  je eine sichtbare H1, eindeutige IDs, vorhandene Inhaltsanker, kein Text- oder
  Dokumentüberlauf und weiterhin `noindex, follow`.
  Isolierte statische Browser-Fixture mit ausschließlich Loopback-GETs;
  Bild-Endpunkte lieferten gebündelte Originaldateien, keine Prüfung der
  produktiven Worker-Bildtransformation. Keine Formulare, CAPTCHA oder Karte
  betätigt. Deaktivierten Formularpfad zusätzlich quellseitig geprüft, kein
  erneuter vollständiger Standby-Build in diesem Durchlauf.
- Unabhängige Quellen-/Datenfluss-Gegenprüfung fand im vorläufigen Umfang keine
  weitere konkrete Abweichung; keine qualifizierte Rechtsfreigabe.
- Öffentliche GETs am 22. Oktober 2026 um 12:42 UTC zeigten noch den alten
  Rechtstext einschließlich Zehn-Tage-Zusage. Die Validierung selbst hat nichts
  veröffentlicht; Merge und spätere Bereitstellung sind separat nachzuweisen.
