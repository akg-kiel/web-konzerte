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
      errors.push(message.params.exceptionDetails.text);
    } else if (
      message.method === 'Network.requestWillBeSent' &&
      message.params.type === 'Document'
    ) {
      documentRequests++;
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
      `document.fonts.ready.then(() => { window.__programmeDocument = crypto.randomUUID(); scrollTo({ top: 180, behavior: 'instant' }); })`
    );
    await delay(150);
    const before = await measure();
    const requestCount = documentRequests;
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
      assert.equal(
        documentRequests,
        requestCount,
        'Tab switches must use fetch, not document navigation'
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
      assert.equal(documentRequests, requestCount);
    }
    console.log(
      `Programme navigation: ${width}px, stable wrapper/scroll, no document reload, back/forward passed.`
    );
  }
  assert.deepEqual(errors, []);
} finally {
  socket?.close();
  browser.kill('SIGTERM');
  await delay(300);
  if (browser.exitCode === null) browser.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true });
}
