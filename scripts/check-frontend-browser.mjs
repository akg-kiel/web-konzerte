import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Optional built-site check. Only loopback, synthetic data/APIs, and GETs; no real messages.
const origin = new URL(
  process.argv.find((arg) => arg.startsWith('--origin='))?.slice(9) ?? 'http://127.0.0.1:8793'
);
assert(origin.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(origin.hostname));
const profile = await mkdtemp(join(tmpdir(), 'frontend-browser-'));
const screenshots = process.argv.includes('--screenshots') ? join(profile, 'screenshots') : null;
const browser = spawn(
  process.env.CHROME_BIN ?? 'chromium',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    // Headless Linux has no physical mouse; make desktop hover capability explicit.
    '--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank'
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] }
);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error('Chromium startup timeout')), 20000);
    let output = '';
    browser.stderr.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    browser.once('error', reject);
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  let sequence = 0,
    sessionId;
  const pending = new Map(),
    errors = [];
  const call = (method, params = {}, session = sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(Error(`CDP timeout: ${method}`));
      }, 20000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(
        JSON.stringify({ id, method, params, ...(session ? { sessionId: session } : {}) })
      );
    });
  const fulfill = (requestId, content, type) =>
    call('Fetch.fulfillRequest', {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: type }],
      body: Buffer.from(content).toString('base64')
    });
  const poster = await readFile('src/assets/hero/l1130722-hero.jpg');
  const intercept = async ({ requestId, request }) => {
    const url = new URL(request.url);
    if (request.method !== 'GET') {
      await call('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw Error('A non-GET request was blocked.');
    }
    if (url.origin === 'https://challenges.cloudflare.com') {
      await fulfill(
        requestId,
        'window.turnstile={render:()=>"synthetic",reset:()=>{}};',
        'application/javascript'
      );
    } else if (url.origin === origin.origin && /^\/api\/availability\/?$/.test(url.pathname)) {
      await fulfill(requestId, JSON.stringify({ statuses: {} }), 'application/json');
    } else if (url.href.includes('synthetic-poster.jpg')) {
      await fulfill(requestId, poster, 'image/jpeg');
    } else if (url.origin === origin.origin && !url.pathname.startsWith('/api/')) {
      await call('Fetch.continueRequest', { requestId });
    } else {
      await call('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    }
  };
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      clearTimeout(request.timeout);
      pending.delete(message.id);
      if (message.error) request.reject(Error(message.error.message));
      else request.resolve(message.result);
    } else if (message.method === 'Fetch.requestPaused') {
      void intercept(message.params).catch((error) => errors.push(error.message));
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(
        message.params.exceptionDetails.exception?.description ??
          message.params.exceptionDetails.text
      );
    }
  });
  const evaluate = async (expression) => {
    const result = await call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails)
      throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async (expression) => {
    for (let attempt = 0; attempt < 150; attempt++) {
      try {
        if (await evaluate(expression)) return;
      } catch (error) {
        if (!/context|navigat/i.test(error.message)) throw error;
      }
      await delay(100);
    }
    throw Error(`Timed out: ${expression}`);
  };
  const key = async (name) => {
    for (const type of ['keyDown', 'keyUp'])
      await call('Input.dispatchKeyEvent', {
        type,
        key: name,
        code: name,
        windowsVirtualKeyCode: { Enter: 13, Escape: 27, Tab: 9 }[name],
        ...(name === 'Enter' && type === 'keyDown' ? { text: '\r' } : {})
      });
  };
  const load = async (path) => {
    await call('Page.navigate', { url: new URL(path, origin).href });
    await wait(
      `location.pathname === ${JSON.stringify(new URL(path, origin).pathname)} && document.readyState === 'complete'`
    );
    await evaluate('document.fonts.ready');
    await delay(500);
  };
  const screenshot = async (name) => {
    if (!screenshots) return;
    await mkdir(screenshots, { recursive: true });
    const { data } = await call('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });
    await writeFile(join(screenshots, name + '.png'), Buffer.from(data, 'base64'));
  };
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' }, null);
  sessionId = (await call('Target.attachToTarget', { targetId, flatten: true }, null)).sessionId;
  await call('Target.activateTarget', { targetId }, null);
  await call('Page.enable');
  await call('Page.bringToFront');
  await call('Runtime.enable');
  await call('Network.enable');
  await call('Network.setCacheDisabled', { cacheDisabled: true });
  await call('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await call('Page.addScriptToEvaluateOnNewDocument', {
    source: `window.__loadShifts = 0; new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__loadShifts += entry.value;
  }).observe({type:'layout-shift', buffered:true});`
  });
  const year = new Date().getFullYear() + 1;
  const detail = `/programm/synthetisches-konzert-mit-ticket-90001-${year}-08-06/`;
  const noPoster = `/programm/synthetisches-konzert-ohne-ticket-90002-${year}-08-07/`;
  const archiveDetail = '/programm/synthetisches-archivkonzert-90003-2020-08-06/';
  const paths = [
    '/',
    '/programm/',
    '/programm/archiv/',
    detail,
    noPoster,
    archiveDetail,
    '/besuch-planen/',
    '/kontakt/',
    '/f%C3%BCr-veranstalter/',
    '/impressum/',
    '/datenschutz/'
  ];
  for (const width of process.argv.includes('--interactions-only')
    ? []
    : [320, 375, 430, 768, 1280]) {
    await call('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    for (const path of paths) {
      await load(path);
      assert(
        await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),
        `${path} ${width}: horizontal overflow`
      );
      const seeker = await evaluate(`(() => {
        const nav = document.querySelector('[data-page-seeker]'), links = [...nav.querySelectorAll('a')];
        return { shown: getComputedStyle(nav).display !== 'none', count: links.length, current: links.filter(a=>a.hasAttribute('aria-current')).length,
          valid: links.every(a => { const target = document.getElementById(decodeURIComponent(a.hash.slice(1))); return a.getAttribute('aria-label') && target && !target.closest('[hidden], [inert]'); }) };
      })()`);
      assert(seeker.valid, `${path}: stale or unnamed seeker anchor`);
      if (width < 1024) assert(!seeker.shown);
      else if (seeker.count > 1) assert(seeker.shown && seeker.current === 1);
      if (path.includes('veranstalter')) {
        await wait(
          `document.querySelector('[aria-label^="Verfügbarkeit auswählen"]')?.closest('[aria-busy]')?.getAttribute('aria-busy') === 'false'`
        );
        assert(
          await evaluate(`(() => {
          const calendar = document.querySelector('[aria-label^="Verfügbarkeit auswählen"]');
          // Check every ancestor clip, not merely document overflow.
          return [...calendar.querySelectorAll('th, [role="gridcell"] > *, button')].every(cell => {
            const r = cell.getBoundingClientRect(); if (!r.width) return true;
            for (let parent = cell.parentElement; parent; parent = parent.parentElement) {
              if (['hidden','clip','auto','scroll'].includes(getComputedStyle(parent).overflowX)) {
                const p = parent.getBoundingClientRect(); if (r.left < p.left - 1 || r.right > p.right + 1) return false;
              }
            }
            return r.left >= 0 && r.right <= innerWidth + 1;
          });
        })()`),
          `Calendar ${width}: clipped columns or month controls`
        );
        await evaluate(
          `document.querySelector('[aria-label^="Verfügbarkeit auswählen"]').scrollIntoView({block:'center',behavior:'instant'})`
        );
        const heading =
          'document.querySelector(\'[aria-label^="Verfügbarkeit auswählen"] header h2\').textContent';
        const before = await evaluate(heading);
        await evaluate(`document.querySelector('[aria-label="Nächster Monat"]').focus()`);
        await key('Enter');
        await wait(`(${heading}) !== ${JSON.stringify(before)}`);
        await evaluate(`document.querySelector('[aria-label="Vorheriger Monat"]').focus()`);
        await key('Enter');
        await wait(`(${heading}) === ${JSON.stringify(before)}`);
        await screenshot(`calendar-${width}`);
      }
      if ([375, 1280].includes(width))
        console.log(
          `Load-shift sum (local, unthrottled, not field CLS): ${width}px ${path} ${await evaluate('window.__loadShifts')}`
        );
      if (width === 375 && [detail, '/programm/'].includes(path)) {
        assert(
          await evaluate(`(() => {
          const ctas = [...document.querySelectorAll('main a[href="https://tickets.example.invalid/test"]')].filter(a=>!a.closest('[hidden], [inert]'));
          return ctas.length && ctas.every(a => { const r=a.getBoundingClientRect(); return r.width >= 24 && r.height >= 24 && r.left >= 0 && r.right <= innerWidth; });
        })()`),
          'Synthetic ticket CTA must remain visible and usable.'
        );
        await evaluate(
          `document.querySelector('main a[href="https://tickets.example.invalid/test"]').scrollIntoView({block:'center',behavior:'instant'})`
        );
        assert(
          await evaluate(`(() => {
          const a = document.querySelector('main a[href="https://tickets.example.invalid/test"]'), r = a.getBoundingClientRect();
          return a.contains(document.elementFromPoint(r.x + r.width/2, r.y + r.height/2));
        })()`),
          'Ticket action must not be covered by the fixed header or another element.'
        );
        const imageSelector =
          path === detail ? 'main article img' : '[data-programme-panel]:not([hidden]) article img';
        await evaluate(
          `document.querySelector('${imageSelector}').scrollIntoView({block:'center',behavior:'instant'})`
        );
        await wait(
          `document.querySelector('${imageSelector}').complete && document.querySelector('${imageSelector}').naturalWidth > 0`
        );
        assert(
          await evaluate(`(() => {
          const image = document.querySelector('${imageSelector}'), r=image.getBoundingClientRect();
          return image.hasAttribute('width') && image.hasAttribute('height') && r.left>=0 && r.right<=innerWidth && Math.abs(r.width/r.height - 4/3)<0.02;
        })()`),
          'Poster crop must stay within the mobile viewport with reserved intrinsic dimensions.'
        );
        await screenshot(path === detail ? 'concert-375' : 'programme-375');
      }
    }
    console.log(
      `Frontend ${width}px: 11 page variants, real named seeker targets, mobile hiding, full calendar ancestor-clip checks passed.`
    );
  }
  await call('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await load(detail);
  await wait('document.querySelector("concert-share")?.dataset.ready === "true"');
  await evaluate(
    `window.__shared = null; Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__shared=data;}}); document.querySelector('concert-share summary').focus()`
  );
  assert(
    await evaluate(`document.activeElement === document.querySelector('concert-share summary')`),
    'Summary must accept keyboard focus.'
  );
  await key('Enter');
  await wait('window.__shared !== null');
  assert.equal(await evaluate('window.__shared.url'), 'https://petruskirche.events' + detail);
  assert.equal(await evaluate('window.__shared.title'), 'Synthetisches Konzert mit Ticket');
  await evaluate(
    `Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancel','AbortError')}}); document.querySelector('concert-share summary').focus()`
  );
  await key('Enter');
  await wait(
    `document.querySelector('concert-share [role=status]').textContent === 'Teilen abgebrochen.'`
  );
  assert(await evaluate('!document.querySelector("concert-share details").open'));
  await evaluate(
    `Object.defineProperty(navigator,'share',{configurable:true,value:undefined}); Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Denied')}}}); document.querySelector('concert-share summary').focus()`
  );
  await key('Enter');
  await wait(`document.querySelector('concert-share details').open`);
  assert(
    await evaluate(
      `document.activeElement === document.querySelector('concert-share input') && document.activeElement.selectionEnd === document.activeElement.value.length`
    )
  );
  assert(
    await evaluate(
      `document.querySelector('concert-share [role=status]').textContent.includes('manuell')`
    )
  );
  console.log(
    'Sharing: trusted Enter, exact title/canonical URL, neutral cancellation, denied clipboard/manual selected fallback passed.'
  );

  await call('Emulation.setScriptExecutionDisabled', { value: true });
  await load(detail);
  await evaluate(`document.querySelector('concert-share summary').focus()`);
  await key('Enter');
  assert(
    await evaluate(
      `document.querySelector('concert-share details').open && document.querySelector('concert-share input').value === 'https://petruskirche.events' + location.pathname`
    ),
    'No-JS manual copying must remain available.'
  );
  await call('Emulation.setScriptExecutionDisabled', { value: false });
  console.log(
    'Sharing without JavaScript: native disclosure and canonical manual-copy field passed.'
  );

  // Exercise the real ClientRouter and its head-only programme swaps, then a full body swap.
  await load('/programm/');
  for (const path of ['/programm/archiv/', '/programm/']) {
    await evaluate(
      `document.querySelector('nav[aria-label="Konzertprogramm"] a[href="${path}"]').click()`
    );
    await wait(
      `location.pathname === '${path}' && !!document.querySelector('[data-page-seeker] a[href="#${path.includes('archiv') ? 'archiv' : 'programm'}"]')`
    );
    assert(
      await evaluate(
        `document.querySelectorAll('[data-page-seeker]').length === 1 && [...document.querySelectorAll('[data-page-seeker] a')].every(a=>!document.getElementById(a.hash.slice(1)).closest('[hidden], [inert]'))`
      )
    );
  }
  await evaluate(
    `document.querySelector('nav[aria-label="Hauptnavigation"] a[href="/besuch-planen/"]').click()`
  );
  await wait(
    `location.pathname === '/besuch-planen/' && document.querySelector('[data-page-seeker] a[href="#anfahrt"]')`
  );
  await evaluate(
    `document.querySelector('[data-page-seeker] a[href="#barrierefreiheit"]').focus()`
  );
  await key('Enter');
  await wait(
    `location.hash === '#barrierefreiheit' && document.querySelector('[data-page-seeker] [aria-current="location"]')?.hash === '#barrierefreiheit'`
  );
  await screenshot('seeker-desktop');
  await call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  assert(
    await evaluate(
      `getComputedStyle(document.documentElement).scrollBehavior === 'auto' && [...document.querySelectorAll('[data-page-seeker] a > span:first-child')].every(s=>getComputedStyle(s).transitionProperty === 'none')`
    )
  );
  console.log(
    'Seeker: head-only programme/archival swaps, full body swap, keyboard anchor/current state and reduced motion passed.'
  );

  assert(await evaluate(`matchMedia('(hover: hover) and (pointer: fine)').matches`));
  for (const height of [640, 900]) {
    await call('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });
    for (const path of ['/', '/kontakt/', '/besuch-planen/', detail, '/datenschutz/']) {
      await load(path);
      const hashes = await evaluate(
        `Array.from(document.querySelectorAll('[data-page-seeker] a'), a => a.hash)`
      );
      assert.equal(hashes[0], '#page-content');
      assert(
        await evaluate(`(() => {
        const nav = document.querySelector('[data-page-seeker]'), r = nav.getBoundingClientRect();
        return !nav.hidden && r.top >= 80 && r.bottom <= innerHeight;
      })()`),
        `${path}: every seeker control must fit below the header`
      );
      const rail = await evaluate(
        `(() => { const r = document.querySelector('[data-page-seeker] a').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`
      );
      await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...rail });
      await wait(
        `Array.from(document.querySelectorAll('[data-page-seeker] a > span:last-child')).every(s => getComputedStyle(s).opacity === '1')`
      );
      for (const hash of hashes) {
        const selector = `[data-page-seeker] a[href="${hash}"]`;
        const label = await evaluate(
          `(() => { const r = document.querySelector(${JSON.stringify(selector)}).lastElementChild.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`
        );
        for (const type of ['mousePressed', 'mouseReleased']) {
          await call('Input.dispatchMouseEvent', { type, ...label, button: 'left', clickCount: 1 });
        }
        await wait(
          `location.hash === ${JSON.stringify(hash)} && document.querySelector('[data-page-seeker] [aria-current="location"]')?.hash === ${JSON.stringify(hash)}`
        );
        if (hash !== '#page-content')
          assert(
            await evaluate(
              `document.getElementById(${JSON.stringify(decodeURIComponent(hash.slice(1)))}).getBoundingClientRect().top >= 78`
            ),
            `${path} ${hash}: target obscured by header`
          );
      }
      await evaluate('history.back()');
      await wait(
        `location.hash === ${JSON.stringify(hashes.at(-2))} && document.querySelector('[data-page-seeker] [aria-current="location"]')?.hash === ${JSON.stringify(hashes.at(-2))}`
      );
      if (path === '/kontakt/' && height === 900) await screenshot('seeker-revised-expanded');
    }
  }
  await load('/');
  await evaluate(`(() => {
    const section = document.createElement('section'); section.id = 'late-section'; section.setAttribute('aria-labelledby', 'late-heading');
    const heading = document.createElement('h2'); heading.id = 'late-heading'; heading.textContent = 'Nachgeladener Abschnitt';
    section.append(heading); section.style.minHeight = '500px'; document.querySelector('main').append(section);
  })()`);
  await wait(`!!document.querySelector('[data-page-seeker] a[href="#late-section"]')`);
  await evaluate(
    `window.__seekerLink = document.querySelector('[data-page-seeker] a[href="#late-section"]'); window.__seekerLink.focus(); const section = document.getElementById('late-section'); section.replaceWith(section.cloneNode(true))`
  );
  await delay(100);
  assert(
    await evaluate(
      `document.activeElement === window.__seekerLink && window.__seekerLink === document.querySelector('[data-page-seeker] a[href="#late-section"]')`
    )
  );
  await key('Enter');
  await wait(
    `document.querySelector('[data-page-seeker] [aria-current="location"]')?.hash === '#late-section'`
  );
  await evaluate(`document.getElementById('late-section').hidden = true`);
  await wait(`!document.querySelector('[data-page-seeker] a[href="#late-section"]')`);
  console.log(
    'Seeker revision: every label is clickable, every native landing/current state and Back match at 640/900px height; async insertion/replacement/hiding preserves live targets and focus.'
  );

  await call('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 1,
    mobile: true
  });
  await call('Emulation.setTouchEmulationEnabled', { enabled: true });
  await call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }]
  });
  await load('/kontakt/');
  await evaluate(
    `window.__pulses=[]; Object.defineProperty(navigator,'vibrate',{configurable:true,value:ms=>window.__pulses.push(ms)}); document.querySelector('[data-mobile-menu] summary').focus()`
  );
  assert(await evaluate(`matchMedia('(pointer: coarse)').matches`));
  assert.equal(await evaluate('window.__pulses.length'), 0);
  await key('Enter');
  await wait(`document.querySelector('[data-mobile-menu]').open`);
  assert.equal(await evaluate('window.__pulses.join()'), '8');
  await key('Enter');
  await wait(`!document.querySelector('[data-mobile-menu]').open`);
  assert.equal(await evaluate('window.__pulses.join()'), '8,8');
  await call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await key('Enter');
  await wait(`document.querySelector('[data-mobile-menu]').open`);
  assert.equal(await evaluate('window.__pulses.join()'), '8,8');
  await key('Escape');
  await wait(`!document.querySelector('[data-mobile-menu]').open`);
  console.log(
    'Menu: native keyboard open/close, trusted 8ms calls, no load/focus pulse, reduced-motion no-op passed (mocked hardware).'
  );
  assert.deepEqual(errors, []);
  if (screenshots) console.log(`Screenshots retained at ${screenshots}`);
} finally {
  socket?.close();
  browser.kill('SIGTERM');
  await delay(200);
  if (browser.exitCode === null) browser.kill('SIGKILL');
  if (!screenshots) await rm(profile, { recursive: true, force: true });
}
