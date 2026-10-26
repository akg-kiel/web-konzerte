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
  appendChild(node) {
    this.children.push(node);
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
}
const heading = (id, label, top, hidden = false, section = null) => ({
  id,
  textContent: label,
  top,
  getClientRects: () => (hidden ? [] : [{}]),
  closest: (selector) => (selector === 'section[id]' ? section : hidden ? {} : null),
  getBoundingClientRect() {
    return { top: this.top };
  }
});
let headings = [
  heading('hero', 'Anfang', 0),
  heading('details', 'Details', 1000),
  heading('inactive', 'Versteckt', 0, true)
];
const list = new Node(),
  nav = { querySelector: () => list, hidden: true };
const events = {},
  listeners = new Map(),
  frames = new Map();
let nextFrame = 0;
const context = {
  document: {
    querySelector: () => nav,
    querySelectorAll: () => headings,
    createElement: () => new Node(),
    documentElement: { scrollHeight: 2400 },
    addEventListener: (name, fn) => {
      events[name] = fn;
    }
  },
  window: {
    addEventListener: (name, fn) => {
      listeners.set(name, fn);
    },
    removeEventListener: (name, fn) => {
      if (listeners.get(name) === fn) listeners.delete(name);
    }
  },
  innerHeight: 900,
  scrollY: 0,
  requestAnimationFrame: (fn) => {
    const id = ++nextFrame;
    frames.set(id, fn);
    return id;
  },
  cancelAnimationFrame: (id) => frames.delete(id)
};
runInNewContext(script, context);
const links = () => list.children.map((item) => item.children[0]);
assert.equal(nav.hidden, false);
assert.equal(links().length, 2);
assert.equal(links()[1].href, '#details');
assert.equal(links()[1].attrs['aria-label'], 'Details');
assert.equal(links()[0].attrs['aria-current'], 'location');
headings[0].top = -900;
headings[1].top = 100;
listeners.get('scroll')();
listeners.get('scroll')();
assert.equal(frames.size, 1, 'Scroll updates must coalesce.');
for (const fn of frames.values()) fn();
frames.clear();
assert.equal(links()[1].attrs['aria-current'], 'location');
assert.equal(links()[0].attrs['aria-current'], undefined);
events['astro:before-swap']();
assert.equal(listeners.size, 0);
headings = [heading('archive', 'Archiv', 0), heading('info', 'Infos', 1000)];
events['astro:page-load']();
assert.equal(links().length, 2, 'ClientRouter must rebuild, never duplicate.');
assert.equal(links()[0].href, '#archive');
headings = [heading('only', 'Ein Abschnitt', 0)];
events['astro:page-load']();
assert(nav.hidden);
assert.equal(listeners.size, 0);
assert(source.includes('lg:block print:hidden'));
assert(source.includes('motion-reduce:transition-none'));
console.log(
  'Page seeker: real named anchors, hidden-panel exclusion, active state, batched scroll, ClientRouter cleanup/rebuild and single-section no-op passed.'
);
