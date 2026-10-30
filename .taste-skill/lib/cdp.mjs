// Repository-local CDP helper, using the same Node WebSocket approach as check-programme-navigation.mjs.
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class Browser {
  nextId = 0;
  pending = new Map();
  listeners = new Map();

  static async launch({ width = 1440, height = 900, extraArgs = [] } = {}) {
    const browser = new Browser();
    browser.profile = await mkdtemp(join(tmpdir(), 'homepage-review-'));
    browser.process = spawn(
      process.env.CHROME_PATH || process.env.CHROME_BIN || 'chromium',
      [
        '--headless=new',
        '--remote-debugging-port=0',
        `--user-data-dir=${browser.profile}`,
        `--window-size=${width},${height}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--hide-scrollbars',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--force-color-profile=srgb',
        ...extraArgs,
        'about:blank'
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    browser.exited = new Promise((resolve) => browser.process.once('close', resolve));
    try {
      const endpoint = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Chromium startup timed out')), 20_000);
        let output = '';
        browser.process.stderr.on('data', (chunk) => {
          output += chunk;
          const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
          if (match) {
            clearTimeout(timer);
            resolve(match[1]);
          }
        });
        browser.process.once('error', (error) => {
          clearTimeout(timer);
          reject(
            new Error('Cannot start Chromium; set CHROME_PATH to its executable.', { cause: error })
          );
        });
        browser.process.once('exit', (code) => {
          clearTimeout(timer);
          reject(new Error(`Chromium exited (${code}): ${output.slice(-1000)}`));
        });
      });
      browser.socket = new WebSocket(endpoint);
      await new Promise((resolve, reject) => {
        browser.socket.addEventListener('open', resolve, { once: true });
        browser.socket.addEventListener('error', reject, { once: true });
      });
      browser.socket.addEventListener('message', ({ data }) => {
        const message = JSON.parse(data);
        if (message.id) {
          const request = browser.pending.get(message.id);
          if (!request) return;
          clearTimeout(request.timer);
          browser.pending.delete(message.id);
          if (message.error) request.reject(new Error(message.error.message));
          else request.resolve(message.result);
        } else {
          const listeners = browser.listeners.get(`${message.sessionId ?? ''}|${message.method}`);
          if (listeners) for (const listener of listeners) listener(message.params);
        }
      });
      return browser;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  send(method, params = {}, sessionId, timeoutMs = 30_000) {
    return new Promise((resolve, reject) => {
      const id = ++this.nextId;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  on(sessionId, method, listener) {
    const key = `${sessionId ?? ''}|${method}`;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key).add(listener);
    return () => this.listeners.get(key).delete(listener);
  }

  async newPage({ width = 1440, height = 900, mobile = false } = {}) {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const page = new Page(this, sessionId);
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.setViewport({ width, height, mobile });
    return page;
  }

  async close() {
    if (this.socket) this.socket.close();
    for (const request of this.pending.values()) {
      clearTimeout(request.timer);
      request.reject(new Error('Browser closed'));
    }
    this.pending.clear();
    this.process.kill();
    const timer = setTimeout(() => this.process.kill('SIGKILL'), 3000);
    try {
      await this.exited;
    } finally {
      clearTimeout(timer);
      await rm(this.profile, { recursive: true, force: true, maxRetries: 3 });
    }
  }
}

class Page {
  consoleErrors = [];

  constructor(browser, sessionId) {
    this.browser = browser;
    this.sessionId = sessionId;
    browser.on(sessionId, 'Runtime.exceptionThrown', ({ exceptionDetails }) => {
      this.consoleErrors.push(exceptionDetails.exception?.description ?? exceptionDetails.text);
    });
  }

  send(method, params = {}, timeoutMs = 30_000) {
    return this.browser.send(method, params, this.sessionId, timeoutMs);
  }

  async setViewport({ width, height, mobile = false }) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile
    });
    await this.send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  }

  async goto(url, { timeoutMs = 25_000, settleMs = 1500 } = {}) {
    let off;
    let timer;
    const loaded = new Promise((resolve, reject) => {
      off = this.browser.on(this.sessionId, 'Page.loadEventFired', () => resolve('load'));
      timer = setTimeout(() => reject(new Error(`Navigation timed out: ${url}`)), timeoutMs);
    });
    try {
      const [navigation, result] = await Promise.all([this.send('Page.navigate', { url }), loaded]);
      if (navigation.errorText) throw new Error(navigation.errorText);
      await sleep(settleMs);
      return result;
    } finally {
      clearTimeout(timer);
      off();
    }
  }

  async eval(fnOrExpression, arg) {
    const expression =
      typeof fnOrExpression === 'function'
        ? `(${fnOrExpression.toString()})(${arg === undefined ? '' : JSON.stringify(arg)})`
        : fnOrExpression;
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ?? result.exceptionDetails.text
      );
    }
    return result.result.value;
  }
}
