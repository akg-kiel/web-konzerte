import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';

const elements = [];
const preference = new EventTarget();
preference.matches = false;
const registry = new Map();
globalThis.HTMLElement = class extends EventTarget {
  dataset = {};
  top = 1200;
  constructor() {
    super();
    elements.push(this);
  }
  getBoundingClientRect() {
    return { top: this.top };
  }
};
globalThis.IntersectionObserver = class {
  targets = new Set();
  constructor(callback) {
    this.callback = callback;
    globalThis.motionObserver = this;
  }
  observe(element) {
    this.targets.add(element);
  }
  unobserve(element) {
    this.targets.delete(element);
  }
};
globalThis.window = {
  innerHeight: 900,
  matchMedia: () => preference,
  IntersectionObserver
};
globalThis.document = {
  querySelectorAll: () => elements.filter((element) => element.dataset.motionState === 'pending')
};
globalThis.customElements = {
  get: (name) => registry.get(name),
  define(name, constructor) {
    assert(!registry.has(name), 'The custom element must not be registered twice');
    registry.set(name, constructor);
  }
};
await import('../src/scripts/scroll-reveal.ts');
const Reveal = registry.get('scroll-reveal');
const observer = globalThis.motionObserver;
const make = (top = 1200) => {
  const element = new Reveal();
  element.top = top;
  element.connectedCallback();
  return element;
};

const card = make();
assert.equal(card.dataset.motionState, 'pending');
assert(observer.targets.has(card));
observer.callback([{ target: card, isIntersecting: false }]);
assert.equal(card.dataset.motionState, 'pending');
observer.callback([{ target: card, isIntersecting: true }]);
assert.equal(card.dataset.motionState, 'visible');
assert(!observer.targets.has(card), 'Reveals must unobserve after playing once');
card.disconnectedCallback();
card.connectedCallback();
assert.equal(card.dataset.motionState, 'visible', 'Reconnecting seen content must not replay it');

const keyboard = make();
keyboard.dispatchEvent(new Event('focusin'));
assert.equal(
  keyboard.dataset.motionState,
  'visible',
  'Keyboard focus must reveal content immediately'
);

const replacement = make(300);
assert.equal(
  replacement.dataset.motionState,
  'visible',
  'Visible server-island replacements must not be hidden'
);
assert(!observer.targets.has(replacement));
assert.equal(
  make(-500).dataset.motionState,
  'visible',
  'Content above the viewport has already been seen'
);

const disconnected = make();
disconnected.disconnectedCallback();
assert(!observer.targets.has(disconnected));
disconnected.top = 100;
disconnected.connectedCallback();
assert.equal(
  disconnected.dataset.motionState,
  'visible',
  'A pending element reconnected in view must not stay hidden'
);

const pending = make();
preference.matches = true;
preference.dispatchEvent(new Event('change'));
assert.equal(
  pending.dataset.motionState,
  'visible',
  'Enabling reduced motion must release pending content'
);
assert.equal(observer.targets.size, 0);
assert.equal(make().dataset.motionState, 'visible', 'Reduced motion must never hide new content');

preference.matches = false;
delete window.IntersectionObserver;
registry.clear();
await import('../src/scripts/scroll-reveal.ts?without-observer');
const fallback = new (registry.get('scroll-reveal'))();
fallback.connectedCallback();
assert.equal(
  fallback.dataset.motionState,
  'visible',
  'Unsupported observers must leave content visible'
);
await import('../src/scripts/scroll-reveal.ts?already-registered');

const home = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
for (const section of [
  home.match(/<section\b[^>]*aria-label="Zitat über Musik"[\s\S]*?<\/section>/)?.[0],
  home.match(/<section\b[^>]*aria-labelledby="architecture-heading"[\s\S]*?<\/section>/)?.[0]
]) {
  assert(section, 'The home quotation and church section must exist.');
  assert.doesNotMatch(section, /<scroll-reveal\b/, 'Home content must remain visible.');
}

const stylesheet = postcss.parse(
  await readFile(new URL('../src/styles/globals.css', import.meta.url), 'utf8')
);
const ruleIn = (parent, selector) =>
  parent?.nodes.find((node) => node.type === 'rule' && node.selector === selector);
const declaration = (rule, property) =>
  rule?.nodes.find((node) => node.type === 'decl' && node.prop === property)?.value;
const noPreference = stylesheet.nodes.find(
  (node) => node.type === 'atrule' && node.params === '(prefers-reduced-motion: no-preference)'
);
const mobile = stylesheet.nodes.find(
  (node) => node.type === 'atrule' && node.params === '(width < 64rem)'
);
const feedbackProperties = ['color', 'background-color', 'border-color', 'opacity'];
assert.deepEqual(
  declaration(ruleIn(stylesheet, '.motion-button'), 'transition-property')?.split(', '),
  feedbackProperties,
  'Reduced motion must retain feedback without a scale transition.'
);
assert.deepEqual(
  declaration(ruleIn(noPreference, '.motion-button'), 'transition-property')?.split(', '),
  [...feedbackProperties, 'scale'],
  'Scale transitions must be restricted to no-preference.'
);
assert.equal(
  declaration(ruleIn(mobile, 'html:has([data-mobile-menu][open])'), 'overflow'),
  'hidden',
  'The mobile menu must lock the root scroller, not only the body.'
);

console.log(
  'Scroll reveals, static home content, reduced-motion transitions and mobile root scroll lock passed.'
);
