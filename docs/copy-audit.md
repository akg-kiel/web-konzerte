# Copy audit – AKG-42 / AKG-82 / AKG-87

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

No legal substance was changed.

## Programme landing integration (AKG-87)

Parent integrated the following programme copy after the SEO owner released the file:

- Title: `Konzerte in Kiel | Programm der Petruskirche`
- Description: `Aktuelle Konzerte in Kiel: Programm der Petruskirche mit Klassik, Chor, Musical, Orgel und Crossover sowie Ticketlinks, sobald der Vorverkauf startet.`
- Eyebrow: `Konzertprogramm`
- H1: `Konzerte in Kiel`
- Intro: `Das Konzertprogramm der Petruskirche – Konzerte in Kiel, chronologisch sortiert, mit Detailseiten und Ticketlinks, sobald der Vorverkauf startet.`
- Concerts section heading/eyebrow: `Alle Konzerte`
- Venue/access link text: `Besuch planen →` instead of `Besucherinformationen →`

Rationale: central landing page gets its own title/H1/intro, primary keyword appears in Title/H1/intro, and existing cards already provide internal links to relevant detail pages.

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
- `Konzertkirche Petruskirche` is retained as the venue/site name; `Petruskirche Kiel` is used where the location matters for SEO and clarity.
