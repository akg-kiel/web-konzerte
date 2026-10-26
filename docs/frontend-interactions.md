# Frontend interaction acceptance

## Scope and results

Batch: AKG-103, AKG-110, AKG-27 and AKG-25. No deployment, merge, actual message, secret/configuration change, legal approval or indexing change.

### AKG-103 — partial acceptance only

- Fixed the known availability-calendar clipping locally: a container-relative mobile gutter replaces the viewport breakout, with a fixed-layout, shrinkable seven-column grid. The shared Card and image clips remain intact.
- Local headless Chromium: eleven page variants at 320/375/430/768/1280 CSS px, full calendar ancestor-clip checks (weekdays, dates, month controls), month keyboard navigation, document overflow, mobile poster dimensions/crop, ticket target visibility/hit-testing and native menu actions passed.
- Page variants: home, programme, archive, ticketed detail, no-poster/no-ticket detail, archived detail, visit, contact, inquiry, imprint and privacy. Dynamic concerts/posters and availability were synthetic; local fonts/assets loaded normally. Representative mobile calendar/detail and desktop seeker captures were inspected.
- The unthrottled local load-shift sum observed at 375 and 1280 px was 0 on those eleven entries. It sums LayoutShift entries without recent input until the ready/fonts-plus-500-ms sample, **not** the CLS session-window metric or a Web Vitals pass. No production/cold-cache/network-throttled, long-lived, physical-device or iOS/Safari acceptance is claimed.
- Remaining AKG-103 work: representative real-content mobile/browser/device checks and actual loading/CLS validation under realistic conditions. This batch does not close that ticket.

### AKG-110 — implementation acceptance

Every resolved concert detail, including archived and no-poster variants, has “Jetzt teilen”. Native sharing uses the exact concert title and canonical event URL. Unsupported native sharing copies the URL; rejected/unavailable clipboard and non-abort native errors reveal a labeled selectable manual URL and explicit copy action. Abort is neutral, not success/error. Results use a polite status region; native keyboard activation and no-JavaScript manual copying passed. Native sheets/clipboard are mocked in automation; no claim of real OS target delivery.

### AKG-25 — implementation acceptance

The shared Layout includes one lightweight fixed-right desktop seeker. It derives names and anchors from existing visible main H1/H2 headings, preferring existing section IDs, excluding hidden/inert programme panels and duplicate targets. No invented sections or drag/scroll engine. A current location and hover/focus labels supplement native anchor links. Below desktop width, below 640 px height, in print, without JS or with fewer than two targets it is hidden. Reduced motion disables mark transitions and uses the site's native non-smooth anchor behavior.

Scroll updates coalesce into one animation frame. ClientRouter before-swap cleans listeners; page-load rebuilds after both head-only programme switches and full body replacements. Unit and local browser checks cover names/targets, current state, hidden views, body swaps, keyboard anchors and reduced motion.

## Reproduce

`pnpm test` includes the four tiny offline regression scripts. `pnpm quality` also runs lint, typecheck and the production build.

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
