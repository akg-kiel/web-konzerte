import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync('src/components/layout/PageSeeker.astro', 'utf8');
const script = ts.transpileModule(source.match(/<script>([\s\S]*?)<\/script>/)[1], {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
class Node {
  children = [];
  attrs = {};
  y = 0;
  constructor(id = '') {
    this.id = id;
  }
  get hash() {
    return this.href?.slice(this.href.indexOf('#'));
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  appendChild(node) {
    this.append(node);
  }
  replaceChildren() {
    this.children = [];
  }
  setAttribute(key, value) {
    this.attrs[key] = value;
  }
  removeAttribute(key) {
    delete this.attrs[key];
  }
  getAttribute(key) {
    return this.attrs[key];
  }
  getBoundingClientRect() {
    return { top: this.y - context.scrollY, height: 32 };
  }
  focus() {
    context.document.activeElement = this;
  }
}
function heading(id, label, y, { hidden = false, sectionId = '', named = true } = {}) {
  const node = new Node(id),
    section = new Node(sectionId);
  node.textContent = label;
  node.y = section.y = y;
  section.attrs['aria-labelledby'] = named ? id : 'another-heading';
  node.getClientRects = () => (hidden ? [] : [{}]);
  node.closest = (selector) =>
    selector === 'section[aria-labelledby]' ? section : hidden ? {} : null;
  return node;
}
let headings = [
  heading('first-heading', 'Erster Abschnitt', 800, { sectionId: 'first' }),
  heading('second', 'Zweiter Abschnitt', 1000),
  heading('last', 'Letzter Abschnitt', 1800),
  heading('sidebar', 'Parallele Spalte', 800),
  heading('hidden', 'Versteckt', 0, { hidden: true }),
  heading('calendar', 'Monatsüberschrift', 0, { named: false })
];
const top = new Node('page-content'),
  list = new Node();
const nav = {
  hidden: true,
  querySelector: () => list,
  getBoundingClientRect: () => ({ height: list.children.length * 32 + 16 })
};
const events = {},
  listeners = new Map(),
  mainListeners = new Map(),
  frames = new Map();
let mutation,
  resize,
  nextFrame = 0;
const main = {
  querySelectorAll: (selector) =>
    selector.startsWith('nav')
      ? [{ hash: '#first', textContent: 'Kurzer Navigationsname' }]
      : headings,
  addEventListener: (name, fn) => mainListeners.set(name, fn),
  removeEventListener: (name) => mainListeners.delete(name)
};
class Observer {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    this.active = true;
  }
  disconnect() {
    this.active = false;
  }
}
const context = {
  document: {
    querySelector: (selector) => (selector === 'main' ? main : nav),
    getElementById: () => top,
    createElement: () => new Node(),
    documentElement: { scrollHeight: 3000 },
    addEventListener: (name, fn) => {
      events[name] = fn;
    }
  },
  window: {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => {
      if (listeners.get(name) === fn) listeners.delete(name);
    }
  },
  MutationObserver: class extends Observer {
    constructor(fn) {
      super(fn);
      mutation = this;
    }
  },
  ResizeObserver: class extends Observer {
    constructor(fn) {
      super(fn);
      resize = this;
    }
  },
  getComputedStyle: () => ({ fontSize: '16px', scrollMarginTop: '96px' }),
  location: { hash: '' },
  innerHeight: 900,
  scrollY: 0,
  requestAnimationFrame: (fn) => {
    frames.set(++nextFrame, fn);
    return nextFrame;
  },
  cancelAnimationFrame: (id) => frames.delete(id)
};
const flush = () => {
  for (const [id, fn] of frames) {
    frames.delete(id);
    fn();
  }
};
const links = () => list.children.map((item) => item.children[0]);
const current = () => links().filter((link) => link.attrs['aria-current'] === 'location');
const scroll = (y, hash = '') => {
  context.scrollY = y;
  context.location.hash = hash;
  listeners.get('scroll')();
  flush();
};
runInNewContext(script, context);
assert.equal(nav.hidden, false);
assert.deepEqual(
  links().map((link) => link.hash),
  ['#page-content', '#first', '#second', '#last', '#sidebar']
);
assert.equal(links()[1].attrs['aria-label'], 'Kurzer Navigationsname');
assert.equal(current()[0].hash, '#page-content');
scroll(704, '#first');
assert.equal(
  current()[0].hash,
  '#first',
  'A nearby next section must not steal the native anchor landing.'
);
scroll(950);
assert.equal(
  current()[0].hash,
  '#second',
  'DOM order must not let a parallel sidebar override a later section.'
);
scroll(704, '#sidebar');
assert.equal(current()[0].hash, '#sidebar', 'Equal-height columns respect the requested anchor.');

const focused = links()[2];
focused.focus();
headings[1] = heading('second', 'Zweiter Abschnitt', 1500);
mutation.callback();
flush();
assert.equal(
  links()[2],
  focused,
  'Island replacement with the same anchors preserves link nodes/focus.'
);
scroll(1000);
assert.equal(current()[0].hash, '#first', 'Replaced island nodes must have fresh geometry.');
scroll(1404);
assert.equal(current()[0].hash, '#second');
headings.push(heading('new', 'Nachgeladen', 1950));
mutation.callback();
flush();
assert.equal(links().at(-1).hash, '#new');
assert.equal(
  context.document.activeElement.hash,
  '#second',
  'Changed contents retain an existing focused anchor.'
);

context.document.documentElement.scrollHeight = 2200;
resize.callback();
flush();
scroll(1300, '#last');
assert.equal(
  current()[0].hash,
  '#last',
  'Two end sections can share a clamped landing; keep the clicked one.'
);
scroll(1300);
assert.equal(current()[0].hash, '#new');
scroll(1200);
assert.equal(current()[0].hash, '#first');
headings = [heading('hidden', 'Versteckt', 0, { hidden: true })];
mutation.callback();
flush();
assert(nav.hidden, 'No section navigation for only the page start.');
headings = Array.from({ length: 30 }, (_, i) => heading('section-' + i, 'Abschnitt ' + i, i * 100));
mutation.callback();
flush();
assert(nav.hidden, 'An overlong rail must not put controls behind the fixed header or viewport.');
listeners.get('scroll')();
listeners.get('scroll')();
assert.equal(frames.size, 1);
events['astro:before-swap']();
assert.equal(frames.size, 0);
assert.equal(listeners.size, 0);
assert.equal(mainListeners.size, 0);
assert(!mutation.active && !resize.active);
headings = [heading('archive', 'Archiv', 800)];
context.scrollY = 0;
events['astro:page-load']();
assert.deepEqual(
  links().map((link) => link.hash),
  ['#page-content', '#archive']
);
assert.equal(current().length, 1);
assert(!nav.hidden);
console.log(
  'Page seeker: native landings, parallel/end sections, semantic targets, island replacement, stable focus, viewport fit and observer/router cleanup passed.'
);
