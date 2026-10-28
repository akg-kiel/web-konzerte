import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { Browser } from '/home/zepi/.pi/agent/skills/design-taste-frontend/scripts/lib/cdp.mjs';

const origin = process.argv[2] ?? 'http://127.0.0.1:4321';
const browser = await Browser.launch();
const results = [];
try {
  const page = await browser.newPage();
  await page.goto(origin);
  await page.eval(async () => {
    await document.fonts.ready;
    document.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager';
    });
    await Promise.allSettled([...document.images].map((img) => img.decode()));
  });
  for (const width of [320, 375, 390, 414, 768, 1440]) {
    await page.setViewport({
      width,
      height: width === 768 ? 1024 : width >= 1024 ? 900 : 812,
      mobile: width < 600
    });
    const measured = await page.eval(async () => {
      await document.fonts.ready;
      const size = (el) => {
        const box = el.getBoundingClientRect();
        const css = getComputedStyle(el);
        return {
          width: box.width,
          height: el.offsetHeight,
          font: parseFloat(css.fontSize),
          line: parseFloat(css.lineHeight),
          minHeight: css.minHeight,
          color: css.color,
          transform: css.textTransform,
          tracking: css.letterSpacing
        };
      };
      const visible = (el) => el.getBoundingClientRect().height > 0;
      const summaries = [...document.querySelectorAll('.concert-card p.line-clamp-3')].map((el) => {
        const original = el.textContent;
        const current = size(el);
        el.textContent = 'Ein langer Konzertauszug mit Programm und Mitwirkenden. '.repeat(30);
        const worstCase = size(el);
        el.textContent = original;
        return { current, worstCase };
      });
      const heading = document.querySelector('h1');
      return {
        width: innerWidth,
        rootWidth: document.documentElement.scrollWidth,
        titleCount: document.querySelectorAll('h1').length,
        title: size(heading),
        titleOverflow: heading.scrollWidth > heading.clientWidth,
        intro: size(document.querySelector('.hero-intro')),
        bodyInk: getComputedStyle(document.querySelector('main')).color,
        dates: [...document.querySelectorAll('.concert-card time')].map((el) =>
          size(el.parentElement)
        ),
        summaries,
        overviewLinks: [...document.querySelectorAll('#naechste-konzerte a[href="/programm/"]')]
          .filter(visible)
          .map(size),
        serviceCopy: [...document.querySelectorAll('.cta-card p')].map(size),
        architectureCopy: size(document.querySelector('#architecture-heading + div')),
        brokenImages: [...document.images]
          .filter((img) => img.complete && !img.naturalWidth)
          .map((img) => img.currentSrc)
      };
    });
    assert.equal(measured.rootWidth, width, `No horizontal overflow at ${width}`);
    assert.equal(measured.titleCount, 1);
    assert(measured.title.height / measured.title.line <= 2.05, `Two-line title at ${width}`);
    assert.equal(measured.titleOverflow, false);
    assert.equal(measured.intro.font, 16);
    assert.equal(measured.intro.color, measured.bodyInk);
    assert.equal(measured.architectureCopy.color, measured.bodyInk);
    assert(measured.dates.length > 0, 'Real concert dates must be tested');
    for (const date of measured.dates) {
      assert.equal(date.font, 14);
      assert.equal(date.transform, 'none');
      assert(['normal', '0px'].includes(date.tracking));
    }
    assert(measured.summaries.length > 0, 'Real and worst-case excerpts must be tested');
    for (const { current, worstCase } of measured.summaries) {
      assert.equal(current.font, 16);
      assert.equal(current.color, measured.bodyInk);
      assert(current.height <= current.line * 3 + 1, `No extra excerpt line at ${width}`);
      assert.equal(
        worstCase.height,
        worstCase.line * 3,
        `Long excerpts stay exactly three lines at ${width}`
      );
    }
    assert.equal(measured.overviewLinks.length, 1);
    assert(measured.overviewLinks[0].height >= 44);
    for (const copy of measured.serviceCopy) assert.equal(copy.color, measured.bodyInk);
    assert.deepEqual(measured.brokenImages, []);
    results.push(measured);
  }
  await page.setViewport({ width: 320, height: 812, mobile: true });
  await page.eval(() => document.querySelector('[data-mobile-menu] summary').focus());
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
    text: '\r'
  });
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13
  });
  assert.equal(await page.eval(() => document.querySelector('[data-mobile-menu]').open), true);
  for (const label of ['Programm', 'Besuch planen', 'Raum anfragen', 'Kontakt']) {
    await page.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9
    });
    await page.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9
    });
    assert.equal(await page.eval(() => document.activeElement.textContent.trim()), label);
  }
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27
  });
  assert.equal(await page.eval(() => document.querySelector('[data-mobile-menu]').open), false);
  assert.equal(await page.eval(() => document.activeElement.tagName), 'SUMMARY');
  assert.deepEqual(page.consoleErrors, []);
  await writeFile(
    new URL('./layout-results.json', import.meta.url),
    JSON.stringify({ results, keyboardMenu: 'passed' }, null, 2)
  );
  console.log(
    'Homepage layout passed at 320, 375, 390, 414, 768 and 1440px; long excerpts, programme targets and keyboard menu verified.'
  );
} finally {
  await browser.close();
}
