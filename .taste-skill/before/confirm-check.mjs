import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { Browser, sleep } from '../lib/cdp.mjs';

// Targeted confirmation only: valid native Enter input, rendered lazy image, CSS Color 4 contrast.
const out = '.taste-skill/before';
const blocks = [
  ...readFileSync(new URL('../lib/broken-ui-detectors.md', import.meta.url), 'utf8').matchAll(
    /```js\n([\s\S]*?)```/g
  )
].map((m) => m[1]);
const names = ['overflow', 'overlap', 'clipping', 'edge', 'images', 'zeroGhost', 'unreadable'];
const detectors = `(()=>{${blocks[0]}return {${blocks
  .slice(1)
  .map(
    (s, i) =>
      `${names[i]}:(${s
        .replace(/;\s*$/, '')
        .replace(/\.slice\(0, (?:20|25)\)/g, '')
        .replace('if (hits.length >= 30) return { truncated: true, hits };', '')})()`
  )
  .join(',')}}})()`;
const r = {
  started: new Date().toISOString(),
  scope: 'Targeted follow-up, not a repeat full main-page inspector',
  menu: [],
  church: [],
  contrast: []
};
const save = () => writeFileSync(`${out}/b-confirmations.json`, JSON.stringify(r, null, 2) + '\n');
let browser;
try {
  browser = await Browser.launch();
  const p = await browser.newPage({ width: 320, height: 812 });
  await p.goto('http://127.0.0.1:4321/', { settleMs: 1500 });
  await p.eval(() => document.fonts.ready.then(() => true));
  const key = async (key, code, v) => {
    await p.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code,
      windowsVirtualKeyCode: v,
      ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {})
    });
    await p.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: v });
    await sleep(120);
  };
  const shot = async (name) => {
    const { data } = await p.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${out}/${name}.png`, Buffer.from(data, 'base64'));
  };
  for (const width of [320, 375, 390, 414, 768, 1440]) {
    const height = width === 768 ? 1024 : width === 1440 ? 900 : 812;
    await p.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
    await p.eval(() => scrollTo({ top: 0, behavior: 'instant' }));
    await sleep(250);
    if (width < 1024) {
      await p.eval(() => document.querySelector('[data-mobile-menu] summary').focus());
      await key('Enter', 'Enter', 13);
      const m = {
        width,
        open: await p.eval(() => document.querySelector('[data-mobile-menu]').open)
      };
      assert(m.open, 'Native Enter must open menu; CDP must include text=CR');
      m.smoke = await p.eval(detectors);
      m.measurements = await p.eval(() => {
        const d = document.querySelector('[data-mobile-menu]');
        return {
          root: {
            client: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
            overflow: getComputedStyle(document.documentElement).overflow
          },
          mainVisibility: getComputedStyle(document.querySelector('#page-content')).visibility,
          summary: {
            focusVisible: document.activeElement.matches(':focus-visible'),
            outline: getComputedStyle(document.activeElement).outline
          },
          links: [...d.querySelectorAll('a')].map((a) => {
            const q = a.getBoundingClientRect(),
              s = getComputedStyle(a);
            return {
              text: a.textContent.trim(),
              x: q.x,
              y: q.y,
              w: q.width,
              h: q.height,
              size: s.fontSize,
              lineHeight: s.lineHeight,
              right: q.right
            };
          })
        };
      });
      await shot(`b-${width}-menu-verified`);
      m.tabOrder = [];
      for (let i = 0; i < 4; i++) {
        await key('Tab', 'Tab', 9);
        m.tabOrder.push(
          await p.eval(() => ({
            text: document.activeElement.textContent.trim(),
            insideMenu: !!document.activeElement.closest('[data-mobile-menu]'),
            focusVisible: document.activeElement.matches(':focus-visible'),
            outline: getComputedStyle(document.activeElement).outline
          }))
        );
      }
      await key('Escape', 'Escape', 27);
      m.escape = await p.eval(() => ({
        closed: !document.querySelector('[data-mobile-menu]').open,
        focusReturned:
          document.activeElement === document.querySelector('[data-mobile-menu] summary'),
        mainVisibility: getComputedStyle(document.querySelector('#page-content')).visibility
      }));
      assert(m.escape.closed && m.escape.focusReturned);
      r.menu.push(m);
      save();
    }
    await p.eval(() =>
      document
        .querySelector('section[aria-labelledby="architecture-heading"] img')
        .scrollIntoView({ block: 'center', behavior: 'instant' })
    );
    const church = await p.eval(async () => {
      const img = document.querySelector('section[aria-labelledby="architecture-heading"] img');
      const decoded = await Promise.race([
        img
          .decode()
          .then(() => true)
          .catch(() => false),
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 20000))
      ]);
      const q = img.getBoundingClientRect(),
        s = getComputedStyle(img);
      const ancestors = [];
      for (let el = img; el && el !== document.body; el = el.parentElement) {
        const st = getComputedStyle(el);
        ancestors.push({
          tag: el.tagName,
          opacity: st.opacity,
          visibility: st.visibility,
          display: st.display,
          clipPath: st.clipPath,
          contentVisibility: st.contentVisibility
        });
      }
      const hit = document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2);
      return {
        decoded,
        complete: img.complete,
        natural: [img.naturalWidth, img.naturalHeight],
        rendered: [q.width, q.height],
        x: q.x,
        y: q.y,
        opacity: s.opacity,
        visibility: s.visibility,
        hit: hit?.tagName,
        hitIsImage: hit === img,
        ancestors
      };
    });
    await sleep(400);
    await shot(`b-${width}-church-verified`);
    r.church.push({ width, ...church });
    // Canvas resolves oklab()/color-mix() to sRGB. Composite all ancestor backgrounds and text alpha.
    r.contrast.push({
      width,
      ...(await p.eval(() => {
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        const rgba = (color) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          const c = [...ctx.getImageData(0, 0, 1, 1).data];
          return [c[0], c[1], c[2], c[3] / 255];
        };
        const over = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3]));
        const lum = (c) => {
          const a = c.map((v) => {
            v /= 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          });
          return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        };
        const all = [...document.querySelectorAll('body *')].filter(
          (el) =>
            el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
            el.getBoundingClientRect().width > 1 &&
            el.getBoundingClientRect().height > 1 &&
            [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2)
        );
        const rows = all.map((el) => {
          const chain = [];
          for (let n = el; n; n = n.parentElement) chain.unshift(n);
          let bg = [255, 255, 255];
          for (const n of chain) bg = over(rgba(getComputedStyle(n).backgroundColor), bg);
          const s = getComputedStyle(el),
            fg = over(rgba(s.color), bg),
            ls = [lum(fg), lum(bg)].sort((a, b) => b - a),
            ratio = (ls[0] + 0.05) / (ls[1] + 0.05);
          const size = parseFloat(s.fontSize),
            large = size >= 24 || (size >= 18.66 && parseInt(s.fontWeight) >= 700);
          return {
            tag: el.tagName,
            classes: el.getAttribute('class'),
            text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 80),
            cssColor: s.color,
            bgRGB: bg,
            fgRGB: fg,
            ratio: Math.round(ratio * 100) / 100,
            size,
            large,
            underThreshold: ratio < (large ? 3 : 4.5),
            imageBackdrop: !!el.closest(
              'section[aria-labelledby="hero-heading"],nav[aria-label="Hauptnavigation"]'
            )
          };
        });
        return {
          method: 'sRGB canvas + alpha compositing; gradients/photos/backdrop-filter excluded',
          count: rows.length,
          rows,
          failures: rows.filter((x) => x.underThreshold)
        };
      }))
    });
    save();
  }
  // Check keyboard focus styling on representative React Aria links without navigating.
  await p.eval(() => scrollTo({ top: 0, behavior: 'instant' }));
  r.controlFocus = [];
  for (const selector of ['.hero-actions a:first-child', '.concert-card a[aria-label]']) {
    await p.eval((s) => {
      const el = document.querySelector(s);
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      el.focus();
    }, selector);
    await sleep(150);
    r.controlFocus.push(
      await p.eval((s) => {
        const el = document.querySelector(s),
          c = getComputedStyle(el);
        return {
          selector: s,
          focusVisible: el.matches(':focus-visible'),
          outline: c.outline,
          boxShadow: c.boxShadow
        };
      }, selector)
    );
    await shot(selector.startsWith('.hero') ? 'b-1440-hero-focus' : 'b-1440-card-focus');
  }
  r.finished = new Date().toISOString();
  save();
  console.log(
    JSON.stringify(
      {
        menu: r.menu.map((m) => ({
          width: m.width,
          open: m.open,
          tabOrder: m.tabOrder,
          escape: m.escape,
          measurements: m.measurements
        })),
        church: r.church,
        contrast: r.contrast.map((c) => ({ width: c.width, count: c.count, failures: c.failures })),
        controlFocus: r.controlFocus
      },
      null,
      2
    )
  );
} catch (e) {
  r.error = e.stack;
  save();
  throw e;
} finally {
  if (browser) await browser.close();
}
