# Lokaler Wechsel zwischen Programm und Archiv

Stand: 14. Oktober 2026. Implementierungsabnahme, keine Veröffentlichung oder Launch-Freigabe.

## Umsetzung

- `ProgrammePage.astro` bereitet beide ersten Ergebnisseiten aus derselben Konzertantwort und demselben Zeitpunkt vor. Query-Einstiege erhalten zusätzlich ihre serverseitige Ergebnisansicht.
- Astros öffentliche Loader-/Swap-Hooks schalten frische Ansichten ohne HTML-Abruf, Body-Austausch oder Formular-Neuaufbau um. Astro behält die History; die Aktivierung erfolgt erst im Swap, nicht optimistisch während des Ladens.
- Ein natives GET-Formular ersetzt die Formular-Hydration. Eingaben vor dem Laden der Module bleiben erhalten. Karten verwenden native Links mit den bestehenden Button-Stilen; ihre IDs sind pro Ansicht eindeutig.
- Metadaten stammen aus derselben `PageMetadata.astro`-Komponente wie reguläre Seiten. Verborgene Ansichten sind `hidden` und `inert`. Header-, Footer- und Bereichslinks rufen keine vorbereiteten Programme per Prefetch ab.
- Die gemeinsame Gültigkeit endet nach höchstens fünf Minuten oder früher an einem bekannten Konzertende beziehungsweise relevanten Berliner Tageswechsel. Queries, Pagination, Hash-Ziele, abgelaufene Ansichten und Fehler behalten den Serverpfad. Programm-HTML hat keine positive CDN-Frische, damit der Ablauf nicht dieselbe alte HTML-Kopie nachlädt.

## Kontrollierter Vergleich

Verglichen wurden zwei gebaute Worker-Kopien unter `/tmp` mit identischer Preview-Konfiguration: veröffentlichter Quellstand `0efb1bf` und die lokale Implementierung. Isolierte Chromium-Kontexte, echte Maus-/Touch-Eingaben, je vier Wechsel. Bilder wurden nur für diese Messung durch Ein-Pixel-Antworten ersetzt, um HTML, JavaScript und Layout zu isolieren. Die funktionale Browserabnahme verwendete dagegen normale Bilder.

| Klick bis zwei Animationsframes nach dem Swap |     Bisher | Lokal vorbereitet |
| --------------------------------------------- | ---------: | ----------------: |
| Desktop, 1280 px                              | 186–265 ms |        109–144 ms |
| Touch, 375 px                                 | 139–181 ms |          71–92 ms |
| Touch, langsamer Client                       | 366–537 ms |        103–153 ms |

Langsamer Client: 100 ms zusätzliche Latenz, 2 MB/s Download, 500 KB/s Upload und vierfache CPU-Verlangsamung. Die Messwerte sind Interaktionsdiagnostik, keine INP-/LCP-/Web-Vitals-Messung oder Realgerät-Zertifizierung.

Der Einstieg verschiebt Arbeit nach vorn: HTML wächst von 87.260 auf 151.886 Bytes, extern geladenes JavaScript sinkt von 305.621 auf 17.189 Bytes. Bei kaltem Browser und bereits warmem Datenpfad wurde der Marker „Dokument/Fonts geladen, keine ausstehende Formular-Hydration“ nach 468 → 284 ms erreicht; beim langsamen Client nach 1.088 → 666 ms. Der erste Request je Preview lag bei 912 → 1.042 ms. Je Einstieg nur eine Probe und kein kontrolliert geleerter Upstream-Cache: daraus folgt keine garantierte Kaltstartverbesserung. Der Marker ist insbesondere keine formale Interaktivitätsmetrik; das native Formular funktioniert schon vor den Modulen.

Frühere Messungen mit einer Worker-Kopie unter `/tmp` gegen den ursprünglichen Projektpfad hatten ungleiche Asset-Latenzen. Sie sind kein belastbarer Vergleich des ersten Seitenaufbaus.

## Abnahme und Grenzen

- `pnpm quality` und `git diff --check` grün.
- Dauerhafter optionaler Browsercheck: 320/375/768/1280/1920 px, unveränderter Body/Formular/Wrapper, kein Programme-HTML-Request bei frischem Bereichswechsel, Metadaten, eindeutige IDs, Fokus/Scroll und History.
- Zusätzlich geprüft: schnelle/unterbrochene Wechsel, Entwurfs-Reset, Query-Einstieg und Query-History, Ablauf mit SSR-Rückfall, Mobilmenü samt Fokus und unterbrochene gewöhnliche Navigation.
- Breite Browserabnahme mit normalen Bildern: 320/375/414/768/1280/1920 px, Tastatur, Pagination, Suche/Reset, Datumsfehler, leere Treffer, alte Saisonparameter und ohne JavaScript; kein horizontaler Überlauf, keine Laufzeitfehler oder fachfremden Nicht-GET-Aktionen.
- Verzögerte Module: frühe Suche und unabhängiger Datumswert bleiben erhalten; Suchfeld-Leeren erhält Datum und Fokus.
- Isolierter Worker mit unerreichbarer Test-Datenquelle: beide Routen 503, `no-store`, `noindex`, keine gültigen lokalen Ansichten.
- Keine neue Veröffentlichung, kein Merge, keine ChurchTools-Schreibzugriffe und keine Indexierungsfreigabe. Produktions-/Google-/CLS-/Realgerät-Abnahme bleiben getrennt.
