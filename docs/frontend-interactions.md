# Frontend interaction acceptance

## Scope and results

Batch: AKG-103, AKG-110 and AKG-27. AKG-25 was removed after design feedback. No deployment, merge, actual message, secret/configuration change, legal approval or indexing change.

### AKG-103 — partial acceptance only

- Fixed the known availability-calendar clipping locally: a container-relative mobile gutter replaces the viewport breakout, with a fixed-layout, shrinkable seven-column grid. The shared Card and image clips remain intact.
- Local headless Chromium: eleven page variants at 320/375/430/768/1280 CSS px, full calendar ancestor-clip checks (weekdays, dates, month controls), month keyboard navigation, document overflow, mobile poster dimensions/crop, ticket target visibility/hit-testing and native menu actions passed.
- Page variants: home, programme, archive, ticketed detail, no-poster/no-ticket detail, archived detail, visit, contact, inquiry, imprint and privacy. Dynamic concerts/posters and availability were synthetic; local fonts/assets loaded normally. Representative mobile calendar/detail captures were inspected.
- The unthrottled local load-shift sum observed at 375 and 1280 px was 0 on those eleven entries. It sums LayoutShift entries without recent input until the ready/fonts-plus-500-ms sample, **not** the CLS session-window metric or a Web Vitals pass. No production/cold-cache/network-throttled, long-lived, physical-device or iOS/Safari acceptance is claimed.
- Remaining AKG-103 work: representative real-content mobile/browser/device checks and actual loading/CLS validation under realistic conditions. This batch does not close that ticket.

### AKG-110 — implementation acceptance

Every resolved concert detail, including archived and no-poster variants, has “Jetzt teilen”. Native sharing uses the exact concert title and canonical event URL. Unsupported native sharing copies the URL; rejected/unavailable clipboard and non-abort native errors reveal a labeled selectable manual URL and explicit copy action. Abort is neutral, not success/error. Results use a polite status region; native keyboard activation and no-JavaScript manual copying passed. Native sheets/clipboard are mocked in automation; no claim of real OS target delivery.

After the placement review, sharing lives in the upper concert action row: Back on the left, a quiet icon-and-text action on the right, before the poster/title. It is no longer a second large button below the ticket CTA. This position works consistently on mobile, archived events and events without images. The native disclosure expands across the full row for manual copying, without squeezing the URL into the narrow action slot or moving the Back link. The status region remains mounted even when empty.

Mobbin references were inspected visually, not inferred from search labels:

- [Apple Music concert detail](https://mobbin.com/screens/67d47002-dde8-4849-a277-3eb897cabc20): Share at the upper right, opposite Back. This is the adopted placement pattern, with a visible text label for the website.
- [Eventbrite event preview](https://mobbin.com/screens/c5c743ef-60f0-42a0-8cb1-d0192ddcaf30): utility icons to the right below the event image, separate from ticket booking. Its hierarchy supports treating Share as a secondary page action.
- [DICE concert detail](https://mobbin.com/screens/ae074cf0-3b1d-4718-bfa2-67d4c929c10b): Share on the poster, purchase anchored at the bottom. The poster overlay was not adopted because this site also has concerts without posters.

### AKG-25 — removed / deferred

The page seeker was removed after user feedback rather than iterated further. Its shared-layout mount, component, scroll observers and dedicated tests are deleted, not merely hidden. The browser regression checks that it stays absent on all page variants and after programme/body navigation. AKG-25 is not delivered by this PR.

### Native section links

The shared `html { scroll-padding-top: 7rem }` remains: ordinary section links and `scrollIntoView()` clear the fixed five-rem navbar with two rem of breathing room, independently of the removed widget. Direct hash loads, hash-free scrolling, keyboard links and reduced motion retain browser coverage at mobile/desktop widths.

## Reproduce

`pnpm test` includes offline regressions for sharing, menu haptics and the mobile calendar. `pnpm quality` also runs lint, typecheck and the production build.

After `pnpm build`, start this in one terminal:

```sh
node scripts/serve-frontend-fixture.mjs
```

Then, using a local Chromium/headless-shell executable:

```sh
CHROME_BIN=/path/to/chrome-headless-shell node scripts/check-frontend-browser.mjs --origin=http://127.0.0.1:8793
CHROME_BIN=/path/to/chrome-headless-shell node scripts/check-programme-navigation.mjs --origin=http://127.0.0.1:8793
```

The fixture copies the built Worker to a temporary directory, substitutes three synthetic concerts, blanks secrets, omits mail bindings, refuses non-GET requests and blocks all external Worker fetches. The browser intercepts availability, Turnstile and synthetic posters, blocks non-GET/external traffic, and does not click external ticket URLs. Home/static HTML is the existing build, not newly fetched live data. Stop the fixture with Ctrl+C. Browser captures are optional via `--screenshots` and remain under `/tmp/frontend-browser-*/screenshots`.

## AKG-27 · Optional menu haptics

A single 8 ms Vibration API request follows trusted activation of the mobile menu summary on coarse-pointer devices. Native details behavior remains independent; no load, hover, focus, scroll, or programmatic-toggle haptics. Reduced motion suppresses the pulse. Ticket links and other CTAs deliberately do not vibrate.

Browser support is not a hardware guarantee: Safari/iOS does not support the Vibration API; current Firefox also does not. Chromium/Android support still requires user activation, available hardware and OS/browser permission. No iOS workarounds, dependencies or persistent preferences. No physical vibration has been verified here.

Sources checked during implementation:

- [MDN: Navigator.vibrate](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) — sticky user activation and duration semantics.
- [MDN: Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) — progressive enhancement.
- [Can I use: Vibration API](https://caniuse.com/vibration) — Safari/iOS and Firefox limitations.
