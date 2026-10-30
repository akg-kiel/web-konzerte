# Homepage review checks

These checks require Node 22+, an installed Chrome/Chromium executable, and the site running locally. The CDP browser helper and frozen detector reference are versioned in `lib/`; no agent installation is needed. The helper follows the existing `scripts/check-programme-navigation.mjs` approach. The detector reference is a snapshot from `ui-design-critique/references/broken-ui-detectors.md`, retaining the algorithms used for the original review.

From the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm exec astro preview --host 127.0.0.1 --port 4321
```

In another terminal, set `CHROME_PATH` to your browser executable and run:

```sh
CHROME_PATH=/path/to/chromium node .taste-skill/after/check-layout.mjs
```

The optional first CLI argument selects a different origin. The historical audit scripts use `http://127.0.0.1:4321/`:

```sh
CHROME_PATH=/path/to/chromium node .taste-skill/before/smoke-check.mjs
CHROME_PATH=/path/to/chromium node .taste-skill/before/confirm-check.mjs
```

Running these scripts replaces their JSON/screenshot artifacts with results from the current site; it does not recreate the historical site. The detector results need the triage described in the review, especially for photographic contrast and intentional layering.

`corepack pnpm test` includes an offline dependency check for all three scripts and their bundled detector code, without requiring a browser.
