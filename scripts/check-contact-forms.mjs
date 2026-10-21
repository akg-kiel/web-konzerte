import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Run only against an isolated, enabled local fixture. Every POST is intercepted before networking.
const originFlag = process.argv.find((arg) => arg.startsWith('--origin='));
assert(originFlag, 'Pass --origin=http://127.0.0.1:PORT (or localhost) and set CHROME_BIN.');
const origin = new URL(originFlag.slice('--origin='.length));
assert(
  origin.protocol === 'http:' &&
    ['127.0.0.1', 'localhost'].includes(origin.hostname) &&
    !origin.username &&
    !origin.password &&
    origin.pathname === '/' &&
    !origin.search &&
    !origin.hash,
  'Only a plain HTTP loopback origin is allowed.'
);
const screenshotFlag = process.argv.find((arg) => arg.startsWith('--screenshots='));
const screenshots = screenshotFlag ? resolve(screenshotFlag.slice('--screenshots='.length)) : null;
assert(
  !screenshots || screenshots.startsWith(`${resolve(tmpdir())}/`),
  'Screenshots must go in a temporary subdirectory.'
);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const dateIn = (days) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
const initialDates = { Wunschdatum: dateIn(30), Alternativdatum: dateIn(60) };
const nextDates = { Wunschdatum: dateIn(40), Alternativdatum: dateIn(70) };
const values = {
  contact: {
    Name: 'Synthetische Besucherin',
    'E-Mail': 'synthetic.visitor@example.invalid',
    Betreff: 'Synthetische Browserprobe',
    Nachricht: 'Dies ist ausschließlich eine synthetische Browserprobe.\nKeine echte Nachricht.'
  },
  booking: {
    'Art der Veranstaltung': 'Synthetisches Konzert',
    'Erwartete Besucherzahl': '123',
    'Name / Organisation': 'Synthetischer Kulturverein',
    'E-Mail': 'synthetic.organisation@example.invalid',
    Telefon: '+49 000 123456',
    'Technische Anforderungen und Bemerkungen':
      'Synthetische Bühne und Beleuchtung.\nKeine echte Anfrage.'
  }
};
const turnstileMock = `(() => {
  const widgets = new Map();
  const complete = widget => {
    widget.input.value = 'synthetic-browser-token';
    widget.options.callback(widget.input.value);
  };
  window.turnstile = {
    render(container, options) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'cf-turnstile-response';
      container.append(input);
      const id = String(widgets.size);
      const widget = { input, options };
      widgets.set(id, widget);
      setTimeout(() => complete(widget), 0);
      return id;
    },
    reset(id) {
      const widget = widgets.get(id);
      if (!widget) throw new Error('Unknown synthetic widget');
      widget.input.value = '';
      widget.options['expired-callback']?.();
      setTimeout(() => complete(widget), 0);
    }
  };
})();`;

const profile = await mkdtemp(join(tmpdir(), 'contact-forms-'));
const browser = spawn(
  process.env.CHROME_BIN ?? 'chromium',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-extensions',
    '--disable-sync',
    '--no-first-run',
    '--no-default-browser-check',
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank'
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] }
);
let socket;
try {
  const endpoint = await new Promise((resolveEndpoint, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chromium startup timed out')), 15_000);
    let output = '';
    browser.stderr.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timeout);
        resolveEndpoint(match[1]);
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
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  const pending = new Map();
  const errors = [];
  const posts = []; // Synthetic bodies stay in memory; never print request bodies or tokens.
  let sequence = 0;
  let sessionId;
  let expectedBody;
  let heldPost;
  let turnstileRequests = 0;
  let availabilityRequests = 0;
  const call = (method, params = {}, session = sessionId) =>
    new Promise((resolveCall, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 15_000);
      pending.set(id, { resolve: resolveCall, reject, timeout });
      socket.send(
        JSON.stringify({ id, method, params, ...(session ? { sessionId: session } : {}) })
      );
    });
  const fulfill = (requestId, status, body, contentType = 'application/json') =>
    call('Fetch.fulfillRequest', {
      requestId,
      responseCode: status,
      responseHeaders: [
        { name: 'Content-Type', value: contentType },
        { name: 'Cache-Control', value: 'no-store' }
      ],
      body: Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)).toString('base64')
    });
  const intercept = async ({ requestId, request }) => {
    const url = new URL(request.url);
    if (
      request.method === 'POST' &&
      url.origin === origin.origin &&
      url.pathname === '/api/contact/'
    ) {
      // Leave the response paused until pending-state assertions finish: deterministic latency, no server POST.
      const body = new URLSearchParams(request.postData ?? '');
      assert(expectedBody && !heldPost, 'Unexpected or duplicate contact POST was blocked.');
      assert.equal(
        [...body].length,
        Object.keys(expectedBody).length + 1,
        'Unexpected POST fields.'
      );
      for (const [name, value] of Object.entries(expectedBody)) {
        assert(
          body.getAll(name).length === 1 && body.get(name) === value,
          'POST must contain only synthetic fixture values.'
        );
      }
      assert(
        body.get('cf-turnstile-response') === 'synthetic-browser-token',
        'POST must use the mock challenge.'
      );
      posts.push(body);
      heldPost = requestId;
      return;
    }
    if (request.method !== 'GET') {
      await call('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error('Unexpected non-GET request was blocked.');
    }
    if (
      url.origin === 'https://challenges.cloudflare.com' &&
      url.pathname === '/turnstile/v0/api.js'
    ) {
      turnstileRequests++;
      await fulfill(requestId, 200, turnstileMock, 'application/javascript');
    } else if (url.origin === origin.origin && /^\/api\/availability\/?$/.test(url.pathname)) {
      availabilityRequests++;
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      assert(
        /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to),
        'Availability range must use ISO dates.'
      );
      const statuses = {};
      for (
        let date = new Date(`${from}T00:00:00Z`), day = 0;
        day < 400;
        day++, date.setUTCDate(date.getUTCDate() + 1)
      ) {
        const key = date.toISOString().slice(0, 10);
        if (key > to) break;
        statuses[key] = 'available';
      }
      await fulfill(requestId, 200, { statuses });
    } else if (url.origin === origin.origin && !url.pathname.startsWith('/api/')) {
      await call('Fetch.continueRequest', { requestId });
    } else {
      await call('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      throw new Error('Unexpected external or API GET request was blocked.');
    }
  };
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      clearTimeout(request.timeout);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    } else if (message.method === 'Fetch.requestPaused') {
      void intercept(message.params).catch(async (error) => {
        errors.push(error.message);
        // Fail closed even if a malformed body or unexpected fixture request trips an assertion.
        await call('Fetch.failRequest', {
          requestId: message.params.requestId,
          errorReason: 'BlockedByClient'
        }).catch(() => {});
      });
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push('Uncaught browser exception (details withheld to avoid logging tokens).');
    }
  });
  const checkErrors = () => assert.equal(errors.length, 0, errors.join('\n'));
  const evaluate = async (expression) => {
    checkErrors();
    const result = await call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails)
      throw new Error('Browser evaluation failed; check the isolated fixture and selectors.');
    return result.result.value;
  };
  const wait = async (expression, label) => {
    for (let attempt = 0; attempt < 150; attempt++) {
      checkErrors();
      try {
        if (typeof expression === 'function' ? expression() : await evaluate(expression)) return;
      } catch (error) {
        if (!/context|navigat/i.test(error.message)) throw error;
      }
      await delay(100);
    }
    throw new Error(`Timed out: ${label}`);
  };
  const key = async (name, modifiers = 0) => {
    const code = { Escape: 27, Tab: 9, Enter: 13 }[name];
    for (const type of ['keyDown', 'keyUp']) {
      await call('Input.dispatchKeyEvent', {
        type,
        key: name,
        code: name,
        windowsVirtualKeyCode: code,
        modifiers
      });
    }
  };
  const click = async (selector) => {
    const position = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      element.scrollIntoView({ block: 'center', behavior: 'instant' });
      const rect = element.getBoundingClientRect();
      const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
      return { x, y, hit: element.contains(document.elementFromPoint(x, y)) };
    })()`);
    assert(position.hit, 'Test control must be visible and clickable.');
    for (const type of ['mousePressed', 'mouseReleased']) {
      await call('Input.dispatchMouseEvent', {
        type,
        x: position.x,
        y: position.y,
        button: 'left',
        clickCount: 1
      });
    }
  };
  const form = 'document.querySelector("form[data-mail-form]")';
  const dialog = `${form}.querySelector("dialog[data-mail-success]")`;
  const calendarSelector = '[aria-label^="Verfügbarkeit auswählen"]';
  const pageState = `(() => {
    const nodes = [...document.querySelectorAll('html, body, main, nav[aria-label="Hauptnavigation"], footer')];
    return nodes.map(node => {
      const style = getComputedStyle(node);
      return [node.inert, style.overflowX, style.overflowY, style.position, style.filter,
        style.backdropFilter, style.opacity, style.pointerEvents];
    });
  })()`;
  const snapshot = () =>
    evaluate(`(() => {
    const form = ${form};
    return {
      controls: [...form.querySelectorAll('input, textarea, select')]
        .filter(e => e.name !== 'cf-turnstile-response')
        .map(e => [e.tagName, e.name, e.type, e.value, e.checked ?? false]),
      segments: [...form.querySelectorAll('[role="spinbutton"][data-type]')]
        .map(e => [e.dataset.type, e.textContent, e.hasAttribute('data-placeholder')]),
      selected: [...form.querySelectorAll('${calendarSelector} [data-selected], ${calendarSelector} [aria-selected="true"]')]
        .map(e => e.getAttribute('aria-label') || e.textContent)
    };
  })()`);
  const assertEmpty = async (kind) => {
    const state = await evaluate(`(() => {
      const form = ${form};
      const visitor = [...form.querySelectorAll('input, textarea, select')]
        .filter(e => !['kind', 'cf-turnstile-response'].includes(e.name));
      return {
        empty: visitor.every(e => ['checkbox', 'radio'].includes(e.type) ? !e.checked : e.value === ''),
        dataEmpty: [...new FormData(form)].every(([name, value]) => ['kind', 'cf-turnstile-response'].includes(name) || value === ''),
        kind: new FormData(form).get('kind'),
        segmentsEmpty: [...form.querySelectorAll('[role="spinbutton"][data-type]')].every(e => e.hasAttribute('data-placeholder')),
        selectionEmpty: !form.querySelector('${calendarSelector} [data-selected], ${calendarSelector} [aria-selected="true"]')
      };
    })()`);
    assert(
      state.empty && state.dataEmpty,
      'Success must clear every visitor control and submitted value.'
    );
    assert.equal(state.kind, kind, 'Reset must retain the routing kind.');
    assert(
      state.segmentsEmpty && state.selectionEmpty,
      'Success must clear both controlled dates and the selected calendar cell.'
    );
  };
  const fillOrdinary = async (kind) => {
    await evaluate(`(() => {
      const form = ${form};
      for (const [name, value] of Object.entries(${JSON.stringify(values[kind])})) {
        const input = [...form.querySelectorAll('input, textarea, select')].find(e => e.name === name);
        if (!input) throw new Error('Missing synthetic input');
        const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
  };
  const fillDateSegments = async (dates) => {
    for (const [index, date] of Object.values(dates).entries()) {
      const [year, month, day] = date.split('-');
      for (const [type, value] of Object.entries({ year, month, day })) {
        await evaluate(`(() => {
          const field = ${form}.querySelectorAll('.react-aria-DateField')[${index}];
          field.querySelector('[data-type="${type}"]').focus();
        })()`);
        for (const digit of String(Number(value))) await call('Input.insertText', { text: digit });
      }
    }
    await evaluate('document.activeElement.blur()');
  };
  const assertFormData = async (expected) => {
    assert(
      await evaluate(`(() => {
      const data = new FormData(${form});
      return Object.entries(${JSON.stringify(expected)}).every(([name, value]) => data.getAll(name).length === 1 && data.get(name) === value);
    })()`),
      'Hydrated FormData must contain the populated synthetic values, including both dates.'
    );
  };
  const submit = async (expected, retained, resets) => {
    await wait(`!${form}.querySelector('[data-mail-submit]').disabled`, 'mock verification ready');
    await assertFormData(expected);
    assert(
      await evaluate(`${form}.reportValidity()`),
      'Synthetic setup must pass real native validation.'
    );
    expectedBody = expected;
    const before = posts.length;
    await evaluate(`${form}.requestSubmit()`);
    await wait(() => posts.length === before + 1 && !!heldPost, 'intercepted contact POST');
    assert(
      await evaluate(`(() => {
      const form = ${form};
      return form.getAttribute('aria-busy') === 'true' && form.querySelector('[data-mail-fields]').disabled && form.querySelector('[data-mail-fields]').inert &&
        form.querySelector('[data-mail-submit]').disabled && !form.querySelector('[data-mail-success]').open &&
        [...form.querySelectorAll('input, textarea, select')].every(e => e.matches(':disabled')) &&
        window.__mailResets === ${resets};
    })()`),
      'Pending send must disable retained controls without resetting or opening success.'
    );
    assert.deepEqual(
      await snapshot(),
      retained,
      'Pending send must retain all values, date segments and selection.'
    );
    if (expected.kind === 'booking') {
      const target = await evaluate(`(() => {
        const form = ${form}, segment = form.querySelector('[role="spinbutton"][data-type]');
        segment.focus();
        const focusBlocked = document.activeElement !== segment;
        const cell = form.querySelectorAll('${calendarSelector} [role="gridcell"] [tabindex]')[10];
        cell.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = cell.getBoundingClientRect();
        return { focusBlocked, x: r.x + r.width / 2, y: r.y + r.height / 2 };
      })()`);
      assert(target.focusBlocked, 'Pending contenteditable date segments must not accept focus.');
      await call('Input.insertText', { text: '5' });
      for (const type of ['mousePressed', 'mouseReleased']) {
        await call('Input.dispatchMouseEvent', {
          type,
          x: target.x,
          y: target.y,
          button: 'left',
          clickCount: 1
        });
      }
      assert.deepEqual(
        await snapshot(),
        retained,
        'Pending date typing and calendar clicks must not change the captured values.'
      );
    }
    // requestSubmit exercises native validation; dispatch additionally exercises the handler's busy guard.
    await evaluate(
      `${form}.requestSubmit(); ${form}.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))`
    );
    await delay(150);
    checkErrors();
    assert.equal(
      posts.length,
      before + 1,
      'Repeated pending submissions must not create another POST.'
    );
  };
  const respond = async (response) => {
    const requestId = heldPost;
    assert(requestId, 'There must be one delayed POST to resolve.');
    heldPost = undefined;
    expectedBody = undefined;
    if (response.network)
      await call('Fetch.failRequest', { requestId, errorReason: 'ConnectionReset' });
    else await fulfill(requestId, response.status, response.body);
    await wait(`${form}.getAttribute('aria-busy') !== 'true'`, 'send settled');
    assert(
      await evaluate(`(() => {
        const form = ${form}, fields = form.querySelector('[data-mail-fields]');
        return !fields.disabled && fields.inert === form.querySelector('[data-mail-success]').open;
      })()`),
      'Settled sends must enable fields but keep them inert exactly while success is open.'
    );
  };
  const checkSuccess = async (kind, reduced, pageBefore) => {
    await wait(`${dialog}.open`, 'modeless success open');
    const immediate = await evaluate('window.__mailSuccessFrames.at(-1)');
    assert(
      immediate?.open && immediate.modal === false && immediate.headingFocused,
      'Accepted send must use modeless show() and initially focus its heading.'
    );
    if (reduced) {
      assert.equal(
        immediate.animations,
        0,
        'Reduced motion must not start overlay, content or SVG animations.'
      );
      assert(
        immediate.checkVisible && immediate.checkOffset === 0,
        'Reduced-motion checkmark must already be visible.'
      );
    } else {
      assert(
        immediate.animations > 0 &&
          immediate.overlayAnimation !== 'none' &&
          immediate.contentAnimation !== 'none' &&
          immediate.ringAnimation !== 'none' &&
          immediate.checkAnimation !== 'none',
        'Normal motion must animate the scoped overlay, content and success seal immediately.'
      );
    }
    await wait(
      `window.__mailResets === window.__mailSuccessFrames.length`,
      'one reset per accepted send'
    );
    await assertEmpty(kind);
    await evaluate(
      `Promise.all(${dialog}.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {})))`
    );
    // Check automatic positioning before the test itself scrolls or moves focus elsewhere.
    assert(
      await evaluate(`(() => {
        const form = ${form}, dialog = ${dialog}, card = form.parentElement;
        const r = dialog.getBoundingClientRect(), boundary = card.getBoundingClientRect();
        const content = dialog.querySelector('[data-mail-success-content]');
        const check = dialog.querySelector('[data-mail-success-check]'), style = getComputedStyle(check);
        const buttons = [...dialog.querySelectorAll('button')];
        const visible = element => {
          const box = element.getBoundingClientRect(), css = getComputedStyle(element);
          return box.width > 0 && box.height > 0 && box.left >= -1 && box.top >= -1 &&
            box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1 &&
            css.visibility === 'visible' && Number(css.opacity) > 0;
        };
        const outside = [[boundary.left - 4, innerHeight / 2], [boundary.right + 4, innerHeight / 2],
          [(boundary.left + boundary.right) / 2, boundary.top - 4], [(boundary.left + boundary.right) / 2, boundary.bottom + 4]]
          .filter(([x, y]) => x >= 0 && x < innerWidth && y >= 0 && y < innerHeight);
        return dialog.open && !dialog.matches(':modal') && getComputedStyle(dialog).position === 'absolute' &&
          getComputedStyle(card).position !== 'static' && dialog.offsetParent === card &&
          ['left', 'top', 'right', 'bottom'].every(edge => Math.abs(r[edge] - boundary[edge]) <= 2) &&
          outside.length > 0 && outside.every(([x, y]) => !dialog.contains(document.elementFromPoint(x, y))) &&
          buttons.length > 0 && [content, check, dialog.querySelector('[data-mail-success-title]'), ...buttons].every(visible) &&
          buttons.every(button => {
            const box = button.getBoundingClientRect();
            return button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
          }) && Number(getComputedStyle(dialog).opacity) > 0 &&
          dialog.scrollWidth <= dialog.clientWidth + 1 && dialog.scrollHeight <= dialog.clientHeight + 1 &&
          document.documentElement.scrollWidth <= innerWidth + 1 && style.stroke !== 'none' && parseFloat(style.strokeDashoffset) === 0;
      })()`),
      'Overlay must cover only the positioned surrounding Card; automatically centered content, check and buttons must be visible without overflow.'
    );
    assert.deepEqual(
      await evaluate(pageState),
      pageBefore,
      'Success must not globally inert, scroll-lock, blur or dim the outside page.'
    );
    assert(
      await evaluate(`(() => {
        const form = ${form}, fields = form.querySelector('[data-mail-fields]');
        const first = fields.querySelector('input:not([type="hidden"]), select, textarea');
        if (!fields.inert || fields.disabled || first.matches(':disabled')) return false;
        return [...fields.querySelectorAll('input:not([type="hidden"]), textarea, select, button, [tabindex], [contenteditable="true"]')]
          .every(element => { element.focus(); return !fields.contains(document.activeElement); });
      })()`),
      'Success must block focus to enabled underlying fields, including date segments and calendar controls.'
    );
    await call('Input.insertText', { text: '5' });
    await assertEmpty(kind);
    await evaluate(`${dialog}.querySelector('[data-mail-success-close]').focus()`);
    await key('Tab');
    assert(
      await evaluate(
        `!${dialog}.contains(document.activeElement) && !${form}.querySelector('[data-mail-fields]').contains(document.activeElement) && ${dialog}.open`
      ),
      'Native Tab must be able to leave the modeless confirmation without entering inert fields.'
    );
    const headerLink = 'nav[aria-label="Hauptnavigation"] a[href="/"]';
    assert(
      await evaluate(`(() => {
        const link = document.querySelector(${JSON.stringify(headerLink)});
        link.focus({ preventScroll: true });
        window.__mailOutsideClicked = false;
        link.addEventListener('click', event => {
          event.preventDefault();
          window.__mailOutsideClicked = event.isTrusted;
        }, { once: true });
        return document.activeElement === link && !link.closest('[inert]');
      })()`),
      'Outside header link must remain focusable while success is open.'
    );
    await click(headerLink);
    assert(
      await evaluate(`window.__mailOutsideClicked && ${dialog}.open`),
      'Outside header link must receive a real click without dismissing success or navigating.'
    );
    const scrollBefore = await evaluate('scrollY');
    await call('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: 8,
      y: 120,
      deltaX: 0,
      deltaY: scrollBefore >= 80 ? -80 : 80
    });
    await wait(`Math.abs(scrollY - ${scrollBefore}) > 1`, 'outside page remains wheel-scrollable');
    await delay(200);
    await evaluate(`(() => {
      const dialog = ${dialog};
      dialog.querySelector('[data-mail-success-content]').scrollIntoView({ block: 'center', behavior: 'instant' });
      dialog.querySelector('[data-mail-success-title]').focus({ preventScroll: true });
    })()`);
    assert(
      await evaluate(
        `${dialog}.open && !${dialog}.matches(':modal') && document.activeElement === ${dialog}.querySelector('[data-mail-success-title]') && ${form}.querySelector('[data-mail-fields]').inert`
      ),
      'External page interaction must leave success open and allow heading focus to be restored for dismissal.'
    );
  };
  const dismiss = async (kind, escape) => {
    if (escape) await key('Escape');
    else await click('[data-mail-success-close]');
    await wait(
      `!${dialog}.open && !${form}.querySelector('[data-mail-fields]').inert && !${form}.querySelector('[data-mail-fields]').disabled && document.activeElement === ${form}.querySelector('input:not([type="hidden"]), select, textarea')`,
      'dismissal unlocks the form and restores first-field focus'
    );
    await assertEmpty(kind);
    if (kind === 'booking') {
      const heading = `${form}.querySelector('${calendarSelector} header h2').textContent`;
      const before = await evaluate(heading);
      // The existing mobile calendar clipping is tracked separately in AKG-103; exercise real keyboard navigation.
      await evaluate(
        `${form}.querySelector('${calendarSelector} [aria-label="Nächster Monat"]').focus()`
      );
      await key('Enter');
      await wait(`(${heading}) !== ${JSON.stringify(before)}`, 'calendar rerender after reset');
      await assertEmpty(kind);
      await evaluate(
        `${form}.querySelector('${calendarSelector} [aria-label="Vorheriger Monat"]').focus()`
      );
      await key('Enter');
      await wait(`(${heading}) === ${JSON.stringify(before)}`, 'calendar returns after rerender');
    }
    await delay(100);
    await assertEmpty(kind);
  };

  const { targetId } = await call('Target.createTarget', { url: 'about:blank' }, null);
  sessionId = (await call('Target.attachToTarget', { targetId, flatten: true }, null)).sessionId;
  await call('Target.activateTarget', { targetId }, null);
  await call('Page.enable');
  await call('Page.bringToFront');
  await call('Runtime.enable');
  await call('Network.enable');
  await call('Network.setBypassServiceWorker', { bypass: true });
  await call('Network.setCacheDisabled', { cacheDisabled: true });
  await call('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await call('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      const dates = ${JSON.stringify(initialDates)};
      window.__mailSeededDates = [];
      const seed = () => {
        for (const input of document.querySelectorAll('form input[type="date"][min][max]')) {
          if (!(input.name in dates) || window.__mailSeededDates.includes(input.name)) continue;
          input.value = dates[input.name];
          window.__mailSeededDates.push(input.name);
        }
      };
      const observer = new MutationObserver(seed);
      observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['type', 'name'] });
      seed();
      document.addEventListener('DOMContentLoaded', () => { seed(); observer.disconnect(); }, { once: true });
    })()`
  });

  for (const width of [375, 1280]) {
    await call('Emulation.setDeviceMetricsOverride', {
      width,
      height: width === 375 ? 812 : 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    for (const [kind, path] of [
      ['contact', '/kontakt/'],
      ['booking', '/f%C3%BCr-veranstalter/#anfrage']
    ]) {
      await call('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }]
      });
      const challengeBefore = turnstileRequests;
      const availabilityBefore = availabilityRequests;
      await call('Page.navigate', { url: new URL(path, origin).href });
      await wait(
        `location.pathname === ${JSON.stringify(new URL(path, origin).pathname)} && document.readyState === 'complete' && !!${form} && !!${dialog} && !${form}.querySelector('[data-mail-submit]').disabled`,
        'enabled form and synthetic challenge'
      );
      await evaluate('document.fonts.ready.then(() => true)');
      const pageBefore = await evaluate(pageState);
      assert(
        turnstileRequests > challengeBefore,
        'Each page must load the intercepted Turnstile script.'
      );
      if (kind === 'booking') {
        await wait(
          `${form}.querySelector('${calendarSelector}')?.closest('[aria-busy]')?.getAttribute('aria-busy') === 'false' && ${form}.querySelectorAll('[role="spinbutton"][data-type]').length === 6`,
          'hydrated availability calendar'
        );
        assert(
          availabilityRequests > availabilityBefore,
          'Calendar must use the intercepted availability response.'
        );
        assert.equal(
          await evaluate('window.__mailSeededDates.length'),
          2,
          'Both dates must be populated before hydration, not patched into controlled hidden inputs.'
        );
      }
      await evaluate(`(() => {
        const form = ${form}, dialog = ${dialog};
        window.__mailResets = 0;
        window.__mailSuccessFrames = [];
        form.addEventListener('reset', () => window.__mailResets++);
        new MutationObserver(() => {
          if (!dialog.open) return;
          const check = dialog.querySelector('[data-mail-success-check]');
          const style = getComputedStyle(check), bounds = check.getBoundingClientRect();
          window.__mailSuccessFrames.push({
            open: dialog.open,
            modal: dialog.matches(':modal'),
            headingFocused: document.activeElement === dialog.querySelector('[data-mail-success-title]'),
            animations: dialog.getAnimations({ subtree: true }).length,
            overlayAnimation: getComputedStyle(dialog).animationName,
            contentAnimation: getComputedStyle(dialog.querySelector('[data-mail-success-content]')).animationName,
            ringAnimation: getComputedStyle(dialog.querySelector('[data-mail-success-ring]')).animationName,
            checkAnimation: style.animationName,
            checkOffset: parseFloat(style.strokeDashoffset),
            checkVisible: bounds.width > 0 && bounds.height > 0 && style.visibility === 'visible' && Number(style.opacity) > 0 &&
              Number(getComputedStyle(dialog).opacity) > 0 && Number(getComputedStyle(check.ownerSVGElement).opacity) > 0 &&
              Number(getComputedStyle(dialog.querySelector('[data-mail-success-content]')).opacity) > 0 &&
              style.stroke !== 'none' && style.stroke !== 'rgba(0, 0, 0, 0)' && Number(style.strokeOpacity) > 0
          });
        }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
      })()`);
      await fillOrdinary(kind);
      const expected = { kind, ...values[kind], ...(kind === 'booking' ? initialDates : {}) };
      await assertFormData(expected);
      if (kind === 'booking') {
        assert(
          await evaluate(
            `!!${form}.querySelector('${calendarSelector} [data-selected], ${calendarSelector} [aria-selected="true"]')`
          ),
          'Migrated desired date must select a calendar cell.'
        );
      }
      const retained = await snapshot();
      for (const response of [
        { status: 502, body: { ok: false, error: 'Synthetische Provider-Ablehnung.' } },
        { status: 503, body: { ok: true } },
        { status: 200, body: { ok: 'true' } },
        { network: true }
      ]) {
        await submit(expected, retained, 0);
        await respond(response);
        await wait(
          `!${form}.querySelector('[data-mail-error]').hidden`,
          'rejection or network ambiguity shown'
        );
        assert.deepEqual(
          await snapshot(),
          retained,
          'Rejected or ambiguous sends must preserve every value and date.'
        );
        assert(
          await evaluate(
            `!${dialog}.open && window.__mailResets === 0 && window.__mailSuccessFrames.length === 0`
          ),
          'Only HTTP acceptance with literal ok:true may reset or show success.'
        );
      }
      await submit(expected, retained, 0);
      await respond({ status: 200, body: { ok: true } });
      await checkSuccess(kind, false, pageBefore);
      if (screenshots) {
        await mkdir(screenshots, { recursive: true });
        const { data } = await call('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false
        });
        await writeFile(join(screenshots, `${kind}-${width}.png`), Buffer.from(data, 'base64'));
      }
      await dismiss(kind, true);

      await call('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
      });
      await fillOrdinary(kind);
      if (kind === 'booking') await fillDateSegments(nextDates);
      const second = { kind, ...values[kind], ...(kind === 'booking' ? nextDates : {}) };
      await submit(second, await snapshot(), 1);
      await respond({ status: 200, body: { ok: true } });
      await checkSuccess(kind, true, pageBefore);
      await dismiss(kind, false);
      assert.equal(
        await evaluate('window.__mailResets'),
        2,
        'Two accepted messages must reset exactly twice in the same document.'
      );
      checkErrors();
      console.log(
        `${kind} ${width}px: pending, rejection, ambiguity, scoped success/reset, outside interaction, keyboard focus and reduced motion passed.`
      );
    }
  }
  assert.equal(
    posts.length,
    24,
    'Each fixture must make four rejected and two accepted synthetic POSTs.'
  );
  assert(!heldPost, 'No synthetic request may remain unresolved.');
  checkErrors();
  console.log(
    'All contact POSTs and availability requests were synthetic; no provider or backend POST was contacted.'
  );
} finally {
  socket?.close();
  browser.kill('SIGTERM');
  await delay(300);
  if (browser.exitCode === null) browser.kill('SIGKILL');
  await rm(profile, { recursive: true, force: true });
}
