import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const originFlag = process.argv.find((arg) => arg.startsWith('--origin='));
assert(originFlag, 'Pass --origin=https://host and set CHROME_BIN to a Chromium executable.');
const origin = new URL(originFlag.slice('--origin='.length));
const profile = await mkdtemp(join(tmpdir(), 'programme-navigation-'));
const browser = spawn(
  process.env.CHROME_BIN ?? 'chromium',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
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
    const timeout = setTimeout(() => reject(new Error('Chromium startup timed out')), 15_000);
    let output = '';
    browser.stderr.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    browser.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    browser.once('exit', () => {
      clearTimeout(timeout);
      reject(new Error('Chromium exited'));
    });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  const pending = new Map();
  const errors = [];
  let sequence = 0;
  let sessionId;
  let documentRequests = 0;
  let programmeRequests = 0;
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      clearTimeout(request.timeout);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(
        message.params.exceptionDetails.exception?.description ??
          message.params.exceptionDetails.text
      );
    } else if (message.method === 'Network.requestWillBeSent') {
      if (message.params.type === 'Document') documentRequests++;
      const url = new URL(message.params.request.url);
      if (
        url.origin === origin.origin &&
        ['/programm/', '/programm/archiv/'].includes(url.pathname)
      ) {
        programmeRequests++;
      }
    }
  });
  const call = (method, params = {}, session = sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 15_000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(
        JSON.stringify({ id, method, params, ...(session ? { sessionId: session } : {}) })
      );
    });
  const evaluate = async (expression) => {
    const result = await call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
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
    throw new Error(`Timed out: ${expression}`);
  };
  const measure = () =>
    evaluate(`(() => {
    const rect = (element) => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
    const nav = document.querySelector('nav[aria-label="Konzertprogramm"]');
    return { nav: rect(nav), form: rect(document.querySelector('form[role="search"]')), scrollY, token: window.__programmeDocument, current: nav.querySelector('[aria-current="page"]').pathname, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
  })()`);
  const compare = (before, after, path) => {
    assert.equal(
      after.token,
      before.token,
      'Switching programme tabs must not reload the document'
    );
    assert.equal(after.current, path);
    assert.equal(after.overflow, false);
    assert(
      Math.abs(after.scrollY - before.scrollY) <= 1,
      'Tab navigation must preserve scroll position'
    );
    for (const group of ['nav', 'form']) {
      for (const key of ['x', 'y', 'width', 'height']) {
        assert(Math.abs(before[group][key] - after[group][key]) <= 1, `${group}.${key} shifted`);
      }
    }
  };
  const checkView = async (path) => {
    const data = await evaluate(`(() => {
      const panels = [...document.querySelectorAll('[data-programme-panel]')];
      const visible = panels.filter(p => !p.hidden);
      const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
      const description = document.head.querySelector('meta[name="description"]').content;
      return { visible: visible.map(p => p.dataset.programmePath), inert: panels.every(p => p.inert === p.hidden),
        count: document.querySelector('[data-programme-count]').textContent.trim(), expectedCount: visible[0]?.dataset.programmeSummary,
        formPath: new URL(document.querySelector('form[role="search"]').action).pathname,
        title: document.title, canonical: document.head.querySelector('link[rel="canonical"]').href,
        og: document.head.querySelector('meta[property="og:url"]').content,
        descriptions: [document.head.querySelector('meta[property="og:description"]').content, document.head.querySelector('meta[name="twitter:description"]').content, JSON.parse(document.head.querySelector('script[type="application/ld+json"]').textContent).description].every(d => d === description),
        metadataCount: document.head.querySelectorAll('[data-page-meta]').length,
        noPrefetch: [...document.querySelectorAll('a[href="/programm/"], a[href="/programm/archiv/"]')].every(a => a.dataset.astroPrefetch === 'false'),
        cardBackgrounds: [...new Set(panels.flatMap(p => [...p.querySelectorAll('article')].map(card => getComputedStyle(card).backgroundColor)))],
        archivedTickets: panels.filter(p => p.dataset.programmePath === '/programm/archiv/').reduce((count, p) => count + p.querySelectorAll('a[id^="tickets-"]').length, 0),
        uniqueIds: new Set(ids).size === ids.length, h1: document.querySelectorAll('h1').length };
    })()`);
    assert.deepEqual(data.visible, [path]);
    assert(data.inert, 'Inactive views must be inert');
    assert(data.uniqueIds, 'Prepared views must not duplicate card or heading IDs');
    assert(data.descriptions, 'Social and structured descriptions must match the page');
    assert(data.noPrefetch, 'Prepared routes must not prefetch programme HTML from any navigation');
    assert.equal(data.h1, 1);
    assert.equal(
      data.cardBackgrounds.length,
      1,
      'Programme and archive cards must share a background'
    );
    assert.equal(data.archivedTickets, 0, 'Archived concerts must not offer ticket actions');
    assert.equal(data.count, data.expectedCount);
    assert.equal(data.formPath, path);
    assert.equal(data.canonical, `https://petruskirche.events${path}`);
    assert.equal(data.og, data.canonical);
    assert.equal(data.metadataCount, 17);
    assert.equal(
      data.title,
      path === '/programm/'
        ? 'Konzerte in Kiel | Programm der Petruskirche'
        : 'Konzertarchiv · Konzertkirche Petruskirche'
    );
  };
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' }, null);
  sessionId = (await call('Target.attachToTarget', { targetId, flatten: true }, null)).sessionId;
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Network.enable');
  for (const width of [1920, 1280, 768, 375, 320]) {
    await call('Emulation.setDeviceMetricsOverride', {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false
    });
    await call('Page.navigate', { url: new URL('/programm/', origin).href });
    await wait(
      `location.pathname === '/programm/' && document.readyState === 'complete' && !!document.querySelector('nav[aria-label="Konzertprogramm"]')`
    );
    await evaluate(
      `document.fonts.ready.then(() => { window.__programmeDocument = crypto.randomUUID(); window.__programmeBody = document.body; window.__programmeForm = document.querySelector('form[role="search"]'); scrollTo({ top: 180, behavior: 'instant' }); })`
    );
    await delay(150);
    const before = await measure();
    const requestCount = documentRequests;
    const programmeCount = programmeRequests;
    for (const path of ['/programm/archiv/', '/programm/']) {
      const position = await evaluate(
        `(() => { const a = document.querySelector('nav[aria-label="Konzertprogramm"] a[href="${path}"]'); const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, hit: a.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) }; })()`
      );
      assert(position.hit, 'Programme navigation must remain clickable between switches');
      await call('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: position.x,
        y: position.y,
        button: 'left',
        clickCount: 1
      });
      await call('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: position.x,
        y: position.y,
        button: 'left',
        clickCount: 1
      });
      await wait(
        `location.pathname === '${path}' && document.querySelector('nav[aria-label="Konzertprogramm"] [aria-current="page"]')?.pathname === '${path}'`
      );
      await evaluate('document.fonts.ready');
      await delay(150);
      compare(before, await measure(), path);
      await checkView(path);
      assert.equal(
        programmeRequests,
        programmeCount,
        'Switching programme views must not fetch HTML'
      );
      assert(
        await evaluate('document.body === window.__programmeBody'),
        'The page body must be preserved'
      );
      assert(
        await evaluate(
          'document.querySelector(\'form[role="search"]\') === window.__programmeForm'
        ),
        'The search form must not be recreated'
      );
      assert.equal(
        documentRequests,
        requestCount,
        'Tab switches must remain in the current document'
      );
      assert(
        await evaluate(
          `document.activeElement === document.querySelector('nav[aria-label="Konzertprogramm"] [aria-current="page"]')`
        ),
        'Focus must follow the active programme link'
      );
    }
    for (const [action, path] of [
      ['back', '/programm/archiv/'],
      ['forward', '/programm/']
    ]) {
      await evaluate(`history.${action}()`);
      await wait(
        `location.pathname === '${path}' && document.querySelector('nav[aria-label="Konzertprogramm"] [aria-current="page"]')?.pathname === '${path}'`
      );
      await delay(150);
      compare(before, await measure(), path);
      await checkView(path);
      assert.equal(documentRequests, requestCount);
      assert.equal(programmeRequests, programmeCount);
    }
    console.log(
      `Programme navigation: ${width}px, stable wrapper/scroll, no HTML fetch/body/form swap, metadata and back/forward passed.`
    );
  }
  // Same-task interruption must settle on the last link without an intermediate server path.
  const rapidCount = programmeRequests;
  await evaluate(`(() => {
    document.querySelector('input[name="q"]').value = 'unsubmitted draft';
    document.querySelector('input[name="from"]').value = '2031-01-01';
    for (const path of ['/programm/archiv/', '/programm/', '/programm/archiv/', '/programm/']) document.querySelector('nav[aria-label="Konzertprogramm"] a[href="'+path+'"]').click();
  })()`);
  await delay(300);
  await checkView('/programm/');
  assert.equal(programmeRequests, rapidCount);
  assert(
    await evaluate(
      "[...document.querySelectorAll('form[role=search] input')].every(i => i.value === '')"
    )
  );

  // A query entry has separate prepared base views; selecting a section clears its filters.
  await call('Page.navigate', { url: new URL('/programm/?q=Christmas', origin).href });
  await wait(
    "document.readyState === 'complete' && document.querySelector('input[name=q]')?.value === 'Christmas'"
  );
  await delay(100);
  const queryCount = programmeRequests;
  await evaluate(
    'document.querySelector(\'nav[aria-label=Konzertprogramm] a[href="/programm/archiv/"]\').click()'
  );
  await wait("location.pathname === '/programm/archiv/' && location.search === ''");
  await checkView('/programm/archiv/');
  assert.equal(programmeRequests, queryCount);
  await evaluate('history.back()');
  await wait(
    "location.search === '?q=Christmas' && document.querySelector('input[name=q]')?.value === 'Christmas'"
  );
  assert(programmeRequests > queryCount, 'Query history must still use the server loader');

  // Expired views must re-enter SSR instead of presenting an old programme snapshot.
  await evaluate(
    "document.querySelector('[data-programme-surface]').dataset.programmeExpires = '0'"
  );
  const expiredCount = programmeRequests;
  await evaluate(
    'document.querySelector(\'nav[aria-label=Konzertprogramm] a[href="/programm/archiv/"]\').click()'
  );
  await wait("location.pathname === '/programm/archiv/' && location.search === ''");
  await checkView('/programm/archiv/');
  assert(programmeRequests > expiredCount);
  // Preserving the body must not leave the main menu covering the new section.
  await evaluate(
    `(() => { const menu = document.querySelector('[data-mobile-menu]'); menu.open = true; menu.querySelector('a[href="/programm/"]').click(); })()`
  );
  await wait(
    "location.pathname === '/programm/' && document.querySelector('nav[aria-label=Konzertprogramm] [aria-current=page]')?.pathname === '/programm/'"
  );
  await checkView('/programm/');
  assert(
    await evaluate(
      "!document.querySelector('[data-mobile-menu]').open && getComputedStyle(document.querySelector('#page-content')).visibility !== 'hidden'"
    )
  );
  assert(
    await evaluate(
      "document.activeElement === document.querySelector('nav[aria-label=Konzertprogramm] [aria-current=page]')"
    )
  );

  // A local request that interrupts an ordinary SSR navigation must not use its old surface.
  await evaluate(
    `(() => { const form = document.querySelector('form[role=search]'); form.querySelector('input[name=q]').value = 'Christmas'; form.requestSubmit(); document.querySelector('nav[aria-label=Konzertprogramm] a[href="/programm/archiv/"]').click(); })()`
  );
  await wait(
    "location.pathname === '/programm/archiv/' && location.search === '' && document.querySelector('nav[aria-label=Konzertprogramm] [aria-current=page]')?.pathname === '/programm/archiv/'"
  );
  await delay(300);
  await checkView('/programm/archiv/');
  console.log(
    'Rapid clicks/draft reset, query history, expiry fallback, mobile menu, and SSR interruption passed.'
  );
  // Device clock offsets must neither disable local switches nor extend their lifetime.
  for (const offset of [-600_000, 600_000]) {
    const { identifier } = await call('Page.addScriptToEvaluateOnNewDocument', {
      source: `const realNow = Date.now; Date.now = () => realNow() + ${offset};`
    });
    await call('Page.navigate', { url: new URL('/programm/', origin).href });
    await wait(
      "document.readyState === 'complete' && !!document.querySelector('[data-programme-surface]')"
    );
    await evaluate(
      "window.__clockBody = document.body; const s = document.querySelector('[data-programme-surface]'); s.dataset.programmeExpires = String(Number(s.dataset.programmeRenderedAt) + 300000)"
    );
    const clockCount = programmeRequests;
    await evaluate(
      'document.querySelector(\'nav[aria-label=Konzertprogramm] a[href="/programm/archiv/"]\').click()'
    );
    await wait(
      "location.pathname === '/programm/archiv/' && document.querySelector('nav[aria-label=Konzertprogramm] [aria-current=page]')?.pathname === '/programm/archiv/'"
    );
    await checkView('/programm/archiv/');
    assert.equal(
      programmeRequests,
      clockCount,
      `Clock offset ${offset} must not trigger HTML navigation`
    );
    assert(await evaluate('document.body === window.__clockBody'));
    await call('Page.removeScriptToEvaluateOnNewDocument', { identifier });
  }

  // Lifetime starts before the first click and is never renewed by local switches.
  await call('Page.navigate', { url: new URL('/programm/', origin).href });
  await wait(
    "document.readyState === 'complete' && !!document.querySelector('[data-programme-surface]')"
  );
  await evaluate(
    "const s = document.querySelector('[data-programme-surface]'); s.dataset.programmeExpires = String(Number(s.dataset.programmeRenderedAt) + 100)"
  );
  await delay(150);
  const agedCount = programmeRequests;
  await evaluate(
    'document.querySelector(\'nav[aria-label=Konzertprogramm] a[href="/programm/archiv/"]\').click()'
  );
  await wait(
    "location.pathname === '/programm/archiv/' && document.querySelector('nav[aria-label=Konzertprogramm] [aria-current=page]')?.pathname === '/programm/archiv/'"
  );
  assert(programmeRequests > agedCount, 'An already aged surface must reload on its first switch');
  const { identifier: monotonicScript } = await call('Page.addScriptToEvaluateOnNewDocument', {
    source:
      "window.__testNow = 0; Object.defineProperty(performance, 'now', { configurable: true, value: () => window.__testNow });"
  });
  await call('Page.navigate', { url: new URL('/programm/', origin).href });
  await wait(
    "document.readyState === 'complete' && !!document.querySelector('[data-programme-surface]')"
  );
  await evaluate(
    "window.__testNow = 10000; const s = document.querySelector('[data-programme-surface]'); s.dataset.programmeExpires = String(Number(s.dataset.programmeRenderedAt) + 20000)"
  );
  const retainedCount = programmeRequests;
  await evaluate(
    'document.querySelector(\'nav[aria-label=Konzertprogramm] a[href="/programm/archiv/"]\').click()'
  );
  await wait(
    "location.pathname === '/programm/archiv/' && document.querySelector('nav[aria-label=Konzertprogramm] [aria-current=page]')?.pathname === '/programm/archiv/'"
  );
  assert.equal(programmeRequests, retainedCount);
  await evaluate('window.__testNow = 20001');
  await evaluate(
    'document.querySelector(\'nav[aria-label=Konzertprogramm] a[href="/programm/"]\').click()'
  );
  await wait(
    "location.pathname === '/programm/' && document.querySelector('nav[aria-label=Konzertprogramm] [aria-current=page]')?.pathname === '/programm/'"
  );
  assert(programmeRequests > retainedCount, 'Local swaps must not renew the lifetime');
  await call('Page.removeScriptToEvaluateOnNewDocument', { identifier: monotonicScript });
  await call('Page.navigate', { url: new URL('/programm/', origin).href });
  await wait(
    "document.readyState === 'complete' && !!document.querySelector('[data-programme-surface]')"
  );

  // Hidden pages cannot keep a stale snapshot if the monotonic device clock pauses in sleep.
  await evaluate(
    "Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden"
  );
  const hiddenCount = programmeRequests;
  await evaluate(
    'document.querySelector(\'nav[aria-label=Konzertprogramm] a[href="/programm/archiv/"]\').click()'
  );
  await wait(
    "location.pathname === '/programm/archiv/' && document.querySelector('nav[aria-label=Konzertprogramm] [aria-current=page]')?.pathname === '/programm/archiv/'"
  );
  assert(programmeRequests > hiddenCount, 'Hidden snapshots must re-enter the server path');

  // Hide/show after a default loader finishes but before its incoming body is installed.
  await evaluate(`document.addEventListener('astro:before-preparation', event => {
    const load = event.loader;
    event.loader = async () => {
      await load();
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    };
  }, { once: true });
  const form = document.querySelector('form[role=search]'); form.querySelector('input[name=q]').value = 'Christmas'; form.requestSubmit();`);
  await wait(
    "new URLSearchParams(location.search).get('q') === 'Christmas' && document.querySelector('input[name=q]')?.value === 'Christmas'"
  );
  const incomingCount = programmeRequests;
  await evaluate(
    'document.querySelector(\'nav[aria-label=Konzertprogramm] a[href="/programm/archiv/"]\').click()'
  );
  await wait(
    "location.pathname === '/programm/archiv/' && document.querySelector('nav[aria-label=Konzertprogramm] [aria-current=page]')?.pathname === '/programm/archiv/'"
  );
  assert(
    programmeRequests > incomingCount,
    'Visibility changes must invalidate incoming SSR snapshots too'
  );
  const { identifier: hiddenScript } = await call('Page.addScriptToEvaluateOnNewDocument', {
    source: "Object.defineProperty(document, 'hidden', { configurable: true, value: true });"
  });
  await call('Page.navigate', { url: new URL('/programm/', origin).href });
  await wait(
    "document.readyState === 'complete' && !!document.querySelector('[data-programme-surface]')"
  );
  await call('Page.removeScriptToEvaluateOnNewDocument', { identifier: hiddenScript });
  await evaluate("delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))");
  const initiallyHiddenCount = programmeRequests;
  await evaluate(
    'document.querySelector(\'nav[aria-label=Konzertprogramm] a[href="/programm/archiv/"]\').click()'
  );
  await wait(
    "location.pathname === '/programm/archiv/' && document.querySelector('nav[aria-label=Konzertprogramm] [aria-current=page]')?.pathname === '/programm/archiv/'"
  );
  assert(
    programmeRequests > initiallyHiddenCount,
    'Initially hidden snapshots must re-enter the server path'
  );
  console.log(
    'Client clock offsets, deterministic expiry without renewal, and incoming/hidden invalidation passed.'
  );
  assert.deepEqual(errors, []);
} finally {
  socket?.close();
  browser.kill('SIGTERM');
  await delay(300);
  if (browser.exitCode === null) browser.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true });
}
