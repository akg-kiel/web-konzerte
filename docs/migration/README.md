# Concert URL migration readiness

Reviewed 2026-10-05 for AKG-90, AKG-89 and AKG-91. No redirects have been applied.

## Existing inventory

Reuse `web-akg/docs/migration/inventory.csv` (local checkout: `/workspace/web-akg`). It contains 768 rows; 174 currently target the configured concert domain:

| Type                      | Rows |
| ------------------------- | ---: |
| Concert posts (`Beitrag`) |  165 |
| Pages (`Seite`)           |    3 |
| Navigation entries        |    3 |
| Categories                |    3 |

The current targets are 170 archive-overview URLs and 4 programme URLs. These rows say **extern verlinken**, not that an individual permanent redirect has been approved. Relevant venue pages retained on the church website also need to stay in the inventory; do not turn the whole church site into concert redirects.

## Mapping assessment

The read-only scout compared 165 legacy posts with 281 public ChurchTools appointments (2016–2028). Its preliminary buckets were 62 date/title candidates, 13 title-only candidates with missing/conflicting dates, 22 ambiguous title-family matches, and 68 without a safe direct match. These are review candidates, not an approved redirect table.

Examples to verify individually:

| Old path                   | Candidate detail path                                 |
| -------------------------- | ----------------------------------------------------- |
| `/29864-2`                 | `/programm/home-for-christmas-46637-2025-11-30/`      |
| `/30532-2`                 | `/programm/das-bruckenkonzert-2026-49975-2026-09-26/` |
| `/30523-2`                 | `/programm/maybebop-47320-2026-09-09/`                |
| `/die-passion-2026`        | `/programm/die-passion-2026-48550-2026-03-22/`        |
| `/home-for-christmas-2026` | `/programm/home-for-christmas-50009-2026-12-04/`      |

Repeated series such as Alte Bekannte, Bläserphilharmonie, Weihnachtsoratorium, Jazzica and SHMF require date/programme verification. Do not map a historical concert to a different occurrence merely because the titles resemble one another. Explicitly record cases without equivalent content rather than silently blanket-redirecting them to an overview.

## Rollout dependencies

- Confirm the final domain under AKG-83. The configured `https://konzerte-petruskirche.de` currently fails DNS resolution; live target validation is not complete.
- Review and approve the explicit mapping required by AKG-89 before AKG-91.
- Redirects must execute on the old `akg-kiel.de` host/repository, not here.
- Preserve working detail links after ChurchTools title/date corrections; current slugs include both. Backwards-compatible identity resolution is being checked separately.
- `/konzerte#archiv` and `/konzerte#ihr_ansprechpartner` are not distinct server requests. Hash fragments cannot select different HTTP redirects; agree on the landing-page behavior.
- Verify each approved 301/308 target, trailing-slash behavior, reachability, and absence of chains/loops at rollout.

The parent read AKG-89/90/91 and confirmed there are no existing issue comments. The scout could not access Linear itself. Inventory coverage and the mapping candidates still need final owner review; none of these tickets is reported as deployed or complete.
