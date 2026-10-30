import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { Browser, sleep } from '../lib/cdp.mjs';

// Read-only browser diagnostics. Run: CHROME_PATH=/path/to/chrome node .taste-skill/before/smoke-check.mjs
const out = '.taste-skill/before';
const reference = readFileSync(new URL('../lib/broken-ui-detectors.md', import.meta.url), 'utf8');
const blocks = [...reference.matchAll(/```js\n([\s\S]*?)```/g)].map((m) => m[1]);
assert.equal(blocks.length, 8, 'Expected shared helper and seven reference detectors');
const names = ['overflow', 'overlap', 'clipping', 'edge', 'images', 'zeroGhost', 'unreadable'];
// Keep the reference algorithms, but remove result caps so counts cannot hide later hits.
const detectors = blocks.slice(1).map((s, i) => ({
  name: names[i],
  source: s
    .replace(/;\s*$/, '')
    .replace(/\.slice\(0, (?:20|25)\)/g, '')
    .replace('if (hits.length >= 30) return { truncated: true, hits };', '')
}));
const detectorExpression = `(() => { ${blocks[0]} return { ${detectors.map((d) => `${d.name}: (${d.source})()`).join(',')} }; })()`;
const widths = [320, 375, 390, 414, 768, 1440];
const result = {
  url: 'http://127.0.0.1:4321/',
  started: new Date().toISOString(),
  widths,
  detectorSource: 'broken-ui-detectors.md; original algorithms, uncapped results',
  networkFailures: [],
  httpErrors: [],
  viewports: []
};
let browser;
let page;
const save = () => writeFileSync(`${out}/smoke.json`, JSON.stringify(result, null, 2) + '\n');

function measure() {
  const round = (n) => Math.round(n * 100) / 100;
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: round(r.x),
      y: round(r.y + scrollY),
      w: round(r.width),
      h: round(r.height),
      right: round(r.right),
      bottom: round(r.bottom + scrollY)
    };
  };
  const shown = (el) => {
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const label = (el) =>
    (el.getAttribute('aria-label') || el.textContent || el.getAttribute('alt') || '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 180);
  const describe = (el) => ({
    tag: el.tagName.toLowerCase(),
    id: el.id,
    classes: el.className?.baseVal ?? el.className,
    label: label(el),
    ...rect(el)
  });
  const font = (el) => {
    const s = getComputedStyle(el);
    return {
      family: s.fontFamily,
      size: s.fontSize,
      lineHeight: s.lineHeight,
      weight: s.fontWeight,
      letterSpacing: s.letterSpacing,
      color: s.color
    };
  };
  const lines = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const rs = [];
    let n;
    while ((n = walker.nextNode())) {
      if (!n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects())
        if (r.width > 0)
          rs.push({
            x: round(r.x),
            y: round(r.y + scrollY),
            w: round(r.width),
            h: round(r.height)
          });
    }
    const ys = [];
    for (const r of rs) if (!ys.some((y) => Math.abs(y - r.y) < 2)) ys.push(r.y);
    return { count: ys.length, rects: rs };
  };
  const box = (el) => {
    const s = getComputedStyle(el);
    return {
      ...describe(el),
      padding: s.padding,
      margin: s.margin,
      gap: s.gap,
      rowGap: s.rowGap,
      columnGap: s.columnGap,
      border: s.borderWidth,
      radius: s.borderRadius,
      display: s.display,
      ...font(el)
    };
  };
  const groups = {};
  for (const el of document.querySelectorAll('body *')) {
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 16) continue;
    const key = el.tagName.toLowerCase() + '.' + [...el.classList].sort().slice(0, 3).join('.');
    (groups[key] ??= []).push(el);
  }
  const repeatedStructures = Object.entries(groups)
    .filter(([, els]) => els.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 25)
    .map(([selector, els]) => ({ selector, count: els.length }));
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,blockquote')]
    .filter(shown)
    .map((el) => ({
      ...describe(el),
      ...font(el),
      lines: lines(el),
      lineClamp: getComputedStyle(el).webkitLineClamp,
      scroll: [el.scrollWidth, el.scrollHeight],
      client: [el.clientWidth, el.clientHeight]
    }));
  const controls = [
    ...document.querySelectorAll('a,button,summary,input,select,textarea,[role="button"]')
  ]
    .filter(shown)
    .map((el) => ({
      ...describe(el),
      ...font(el),
      href: el.getAttribute('href'),
      tabIndex: el.tabIndex,
      ariaHidden: el.getAttribute('aria-hidden'),
      focusVisible: el.matches(':focus-visible'),
      outline: getComputedStyle(el).outline,
      under44: el.getBoundingClientRect().width < 44 || el.getBoundingClientRect().height < 44,
      under24: el.getBoundingClientRect().width < 24 || el.getBoundingClientRect().height < 24
    }));
  const containers = [
    ...document.querySelectorAll(
      'nav[aria-label="Hauptnavigation"] > div.mx-auto, main > section > div.mx-auto, footer > div.mx-auto'
    )
  ]
    .filter(shown)
    .map((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const left = r.left + parseFloat(s.paddingLeft);
      const right = r.right - parseFloat(s.paddingRight);
      return {
        ...box(el),
        section:
          el.parentElement.getAttribute('aria-label') ||
          el.parentElement.getAttribute('aria-labelledby') ||
          el.parentElement.id ||
          el.parentElement.tagName,
        contentLeft: round(left),
        contentRight: round(right),
        leftMargin: round(left),
        rightMargin: round(innerWidth - right),
        asymmetry: round(left - (innerWidth - right))
      };
    });
  const sampleSelectors = [
    '.concert-card',
    '.concert-card > div:last-child',
    '.concert-card h3',
    '.concert-card p',
    '.concert-card a:not([aria-hidden])',
    '.cta-card',
    '.cta-card > h3',
    '.cta-card > p',
    '.cta-card > span:last-child',
    '.hero-actions',
    '.hero-actions a',
    'footer nav ul',
    'footer nav a'
  ];
  const samples = Object.fromEntries(
    sampleSelectors.map((s) => [s, [...document.querySelectorAll(s)].filter(shown).map(box)])
  );
  const grids = [
    ...document.querySelectorAll(
      '#naechste-konzerte .grid, section[aria-labelledby="service-heading"] .grid'
    )
  ]
    .filter(shown)
    .map((el) => {
      const children = [...el.children].filter(shown);
      return {
        ...box(el),
        columns: getComputedStyle(el).gridTemplateColumns,
        items: children.map(box),
        sequentialGaps: children.slice(1).map((b, i) => {
          const a = children[i].getBoundingClientRect();
          const r = b.getBoundingClientRect();
          return {
            dx: round(r.left - a.right),
            dy: round(r.top - a.bottom),
            sameRow: Math.abs(r.top - a.top) < 1
          };
        })
      };
    });
  const sections = [...document.querySelectorAll('main > section')].map((el) => ({
    ...box(el),
    marginToNext: el.nextElementSibling
      ? round(el.nextElementSibling.getBoundingClientRect().top - el.getBoundingClientRect().bottom)
      : null
  }));
  const clamped = [...document.querySelectorAll('main *')]
    .filter(shown)
    .filter((el) => {
      const s = getComputedStyle(el);
      return s.webkitLineClamp !== 'none';
    })
    .map((el) => ({
      ...describe(el),
      ...font(el),
      clamp: getComputedStyle(el).webkitLineClamp,
      overflow: getComputedStyle(el).overflow,
      scroll: [el.scrollWidth, el.scrollHeight],
      client: [el.clientWidth, el.clientHeight],
      actualTruncation: el.scrollHeight > el.clientHeight + 2,
      title: el.getAttribute('title')
    }));
  const ctas = [...document.querySelectorAll('.cta-card')].map((el) => {
    const h = el.querySelector('h3');
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      ...box(el),
      tag: el.tagName,
      href: el.getAttribute('href'),
      nestedLinks: el.querySelectorAll('a').length,
      heading: box(h),
      headingOwnLink: h.closest('a') === el,
      pseudoBefore: {
        content: getComputedStyle(el, '::before').content,
        position: getComputedStyle(el, '::before').position
      },
      borderWidth: s.borderWidth,
      bottomPaddingFromLastChild: round(
        r.bottom - el.lastElementChild.getBoundingClientRect().bottom
      )
    };
  });
  const images = [...document.images].map((img) => ({
    ...describe(img),
    alt: img.alt,
    src: img.currentSrc || img.src,
    complete: img.complete,
    natural: [img.naturalWidth, img.naturalHeight],
    fit: getComputedStyle(img).objectFit,
    visibility: getComputedStyle(img).visibility
  }));
  const bodyCopy = [...document.querySelectorAll('p,address,time,cite')]
    .filter(shown)
    .map((el) => ({ ...describe(el), ...font(el), lines: lines(el).count }));
  const icons = [
    ...document.querySelectorAll('.concert-card svg,.cta-card > span:first-child')
  ].map(box);
  return {
    root: {
      innerWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      height: document.documentElement.scrollHeight,
      overflowX: getComputedStyle(document.documentElement).overflowX
    },
    fonts: {
      status: document.fonts.status,
      hanken: document.fonts.check('16px "Hanken Grotesk"'),
      merriweather: document.fonts.check('36px Merriweather')
    },
    counts: {
      h1: document.querySelectorAll('h1').length,
      concertCards: document.querySelectorAll('.concert-card').length,
      ctaCards: ctas.length,
      images: images.length
    },
    repeatedStructures,
    headings,
    controls,
    containers,
    samples,
    grids,
    sections,
    clamped,
    ctas,
    images,
    bodyCopy,
    icons
  };
}

async function capture(name, clip) {
  const { data } = await page.send(
    'Page.captureScreenshot',
    {
      format: 'png',
      captureBeyondViewport: !!clip,
      ...(clip ? { clip: { ...clip, scale: 1 } } : {})
    },
    45000
  );
  writeFileSync(`${out}/${name}.png`, Buffer.from(data, 'base64'));
}
async function captureElement(name, selector) {
  await page.eval(
    (s) => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }),
    selector
  );
  await sleep(200);
  const r = await page.eval((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return {
      x: Math.max(0, r.x - 8),
      y: Math.max(0, r.y + scrollY - 8),
      width: Math.min(innerWidth, r.width + 16),
      height: r.height + 16
    };
  }, selector);
  await capture(name, r);
}
async function decodeImages() {
  return await page.eval(async () => {
    const start = performance.now();
    const pending = [...document.images].map(async (img) => {
      try {
        await img.decode();
        return { alt: img.alt, status: 'decoded', natural: [img.naturalWidth, img.naturalHeight] };
      } catch (e) {
        return {
          alt: img.alt,
          status: 'decode-error',
          error: e.name,
          natural: [img.naturalWidth, img.naturalHeight]
        };
      }
    });
    const decoded = await Promise.race([
      Promise.all(pending),
      new Promise((resolve) => setTimeout(() => resolve(null), 20000))
    ]);
    return {
      elapsedMs: Math.round(performance.now() - start),
      decoded,
      images: [...document.images].map((i) => ({
        alt: i.alt,
        src: i.currentSrc || i.src,
        complete: i.complete,
        natural: [i.naturalWidth, i.naturalHeight]
      }))
    };
  });
}
async function coverage() {
  const selectors = await page.eval(() =>
    [...document.querySelectorAll('.cta-card')]
      .map((_, i) => `.cta-card:nth-child(${i + 1})`)
      .concat(
        [...document.querySelectorAll('.concert-card')].map((el) => `[id=${JSON.stringify(el.id)}]`)
      )
  );
  const cards = [];
  for (const selector of selectors) {
    await page.eval(
      (s) => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }),
      selector
    );
    await sleep(80);
    cards.push(
      await page.eval((s) => {
        const el = document.querySelector(s);
        const h = el.querySelector('h3');
        const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
        const points = [];
        let n;
        while ((n = walker.nextNode())) {
          if (!n.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(n);
          for (const tr of range.getClientRects()) {
            const x = Math.max(0, Math.min(innerWidth - 1, tr.x + tr.width / 2));
            const y = tr.y + tr.height / 2;
            if (y < 0 || y >= innerHeight) continue;
            const hit = document.elementFromPoint(x, y);
            points.push({
              x,
              y,
              hit: hit?.tagName,
              hitClass: hit?.getAttribute('class'),
              hitText: (hit?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
              sameHeading: !!hit && (hit === h || h.contains(hit)),
              ownCardLink: !!hit && hit.closest('a') === h.closest('a') && !!h.closest('a'),
              sameCard: !!hit && (hit === el || el.contains(hit)),
              ariaHidden: hit?.getAttribute('aria-hidden'),
              href: hit?.closest('a')?.getAttribute('href')
            });
          }
        }
        return {
          selector: s,
          heading: h.textContent.trim(),
          pointerEvents: getComputedStyle(h).pointerEvents,
          points
        };
      }, selector)
    );
  }
  await page.eval(() => scrollTo({ top: 0, behavior: 'instant' }));
  return cards;
}
async function key(key, code, virtual) {
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
    code,
    windowsVirtualKeyCode: virtual,
    ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {})
  });
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code,
    windowsVirtualKeyCode: virtual
  });
  await sleep(100);
}

try {
  browser = await Browser.launch({ width: 1440, height: 900 });
  page = await browser.newPage({ width: 320, height: 812 });
  browser.on(page.sessionId, 'Network.loadingFailed', (e) =>
    result.networkFailures.push({ type: e.type, error: e.errorText, canceled: e.canceled })
  );
  browser.on(page.sessionId, 'Network.responseReceived', (e) => {
    if (e.response.status >= 400) {
      const u = new URL(e.response.url);
      result.httpErrors.push({ status: e.response.status, path: u.pathname });
    }
  });
  await page.send('Network.enable');
  result.navigation = await page.goto(result.url, { timeoutMs: 25000, settleMs: 1800 });
  await page.eval(() => document.fonts.ready.then(() => true));
  result.initialImages = await page.eval(() =>
    [...document.images].map((i) => ({
      alt: i.alt,
      complete: i.complete,
      natural: [i.naturalWidth, i.naturalHeight]
    }))
  );
  // Scroll the actual page (no injected CSS or image attribute changes) to trigger every lazy image/reveal.
  for (let i = 0; i < 20; i++) {
    const state = await page.eval((i) => {
      const y = i * innerHeight * 0.8;
      scrollTo({ top: y, behavior: 'instant' });
      return { y, max: document.documentElement.scrollHeight - innerHeight };
    }, i);
    await sleep(150);
    if (state.y >= state.max) break;
  }
  result.imageWaits = [];
  for (let i = 0; i < 6; i++) {
    const state = await decodeImages();
    result.imageWaits.push(state);
    save();
    if (state.decoded !== null && state.images.every((i) => i.complete && i.natural[0] > 0)) break;
  }
  await sleep(1200);
  for (const width of widths) {
    const height = width === 768 ? 1024 : width === 1440 ? 900 : 812;
    await page.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await page.eval(() => scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(1100);
    const item = { width, height, decode: await decodeImages() };
    item.smoke = await page.eval(detectorExpression);
    item.measurements = await page.eval(measure);
    item.cardCoverage = await coverage();
    await capture(`b-${width}-fold`);
    await capture(`b-${width}-page`, {
      x: 0,
      y: 0,
      width,
      height: Math.min(16000, item.measurements.root.height)
    });
    if (width === 320 || width === 1440) {
      await captureElement(`b-${width}-cta-cards`, 'section[aria-labelledby="service-heading"]');
      await captureElement(`b-${width}-church`, 'section[aria-labelledby="architecture-heading"]');
      await captureElement(`b-${width}-concerts`, '#naechste-konzerte');
      await captureElement(`b-${width}-footer`, 'footer');
    }
    if (width < 1024) {
      await page.eval(() => document.querySelector('[data-mobile-menu] summary').focus());
      await key('Enter', 'Enter', 13);
      item.menu = {
        opened: await page.eval(() => ({
          open: document.querySelector('[data-mobile-menu]').open,
          active: document.activeElement.tagName,
          focusVisible: document.activeElement.matches(':focus-visible'),
          outline: getComputedStyle(document.activeElement).outline,
          overflow: getComputedStyle(document.documentElement).overflow,
          mainVisibility: getComputedStyle(document.querySelector('#page-content')).visibility
        }))
      };
      item.menu.smoke = await page.eval(detectorExpression);
      item.menu.measurements = await page.eval(measure);
      await capture(`b-${width}-menu`);
      item.menu.tabOrder = [];
      for (let i = 0; i < 4; i++) {
        await key('Tab', 'Tab', 9);
        item.menu.tabOrder.push(
          await page.eval(() => ({
            tag: document.activeElement.tagName,
            label: document.activeElement.textContent.trim(),
            insideMenu: !!document.activeElement.closest('[data-mobile-menu]'),
            focusVisible: document.activeElement.matches(':focus-visible'),
            outline: getComputedStyle(document.activeElement).outline
          }))
        );
      }
      await key('Escape', 'Escape', 27);
      item.menu.escaped = await page.eval(() => ({
        open: document.querySelector('[data-mobile-menu]').open,
        focusReturned:
          document.activeElement === document.querySelector('[data-mobile-menu] summary'),
        focusVisible: document.activeElement.matches(':focus-visible'),
        mainVisibility: getComputedStyle(document.querySelector('#page-content')).visibility
      }));
    }
    result.viewports.push(item);
    save();
    console.log(
      JSON.stringify({
        width,
        root: item.measurements.root,
        cards: item.measurements.counts,
        detectorCounts: Object.fromEntries(
          Object.entries(item.smoke).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.length : (v.hits?.length ?? v.offenders?.length ?? 0)
          ])
        ),
        hero: item.measurements.headings.find((h) => h.tag === 'h1'),
        menu: item.menu ? { opened: item.menu.opened, escaped: item.menu.escaped } : null
      })
    );
  }
  result.consoleErrors = page.consoleErrors;
  assert.equal(result.viewports.length, 6);
  assert(result.viewports.every((v) => v.measurements.counts.h1 === 1));
  assert(result.viewports.every((v) => v.measurements.counts.ctaCards === 2));
  result.finished = new Date().toISOString();
  save();
} catch (e) {
  result.error = e.stack;
  save();
  throw e;
} finally {
  if (browser) await browser.close();
}
