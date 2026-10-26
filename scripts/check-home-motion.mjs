import assert from 'node:assert/strict';

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
await import('../src/scripts/home-motion.ts');
const Reveal = registry.get('home-reveal');
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
await import('../src/scripts/home-motion.ts?without-observer');
const fallback = new (registry.get('home-reveal'))();
fallback.connectedCallback();
assert.equal(
  fallback.dataset.motionState,
  'visible',
  'Unsupported observers must leave content visible'
);
await import('../src/scripts/home-motion.ts?already-registered');

console.log(
  'Home motion: once-only reveals, island replacements, focus, cleanup, reduced motion and fallback passed.'
);
