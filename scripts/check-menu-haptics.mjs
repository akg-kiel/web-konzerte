import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync('src/components/layout/Header.astro', 'utf8');
const script = ts.transpileModule(source.match(/<script>([\s\S]*?)<\/script>/)[1], {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
function setup({ coarse = true, reduce = false, vibrate } = {}) {
  const handlers = {};
  class Element {
    closest(selector) {
      return selector === '[data-mobile-menu] > summary' ? this : null;
    }
  }
  runInNewContext(script, {
    document: {
      addEventListener: (name, fn) => {
        handlers[name] = fn;
      }
    },
    Element,
    navigator: { vibrate },
    matchMedia: (query) => ({ matches: query.includes('coarse') ? coarse : reduce })
  });
  return { handlers, target: new Element() };
}
let pulses = [];
let test = setup({
  vibrate: (duration) => {
    pulses.push(duration);
  }
});
assert.deepEqual(pulses, [], 'No vibration on load.');
assert.deepEqual(Object.keys(test.handlers).sort(), ['click', 'keydown']);
test.handlers.click({ target: test.target, isTrusted: true });
assert.deepEqual(pulses, [8]);
for (const options of [
  { reduce: true },
  { coarse: false },
  { vibrate: undefined },
  {
    vibrate: () => {
      throw Error('Unsupported');
    }
  }
]) {
  test = setup({
    vibrate: (duration) => {
      pulses.push(duration);
    },
    ...options
  });
  test.handlers.click({ target: test.target, isTrusted: true });
}
assert.deepEqual(pulses, [8]);
test = setup({
  vibrate: (duration) => {
    pulses.push(duration);
  }
});
test.handlers.click({ target: test.target, isTrusted: false });
test.handlers.click({ target: {}, isTrusted: true });
test.handlers.keydown({ target: test.target, key: 'Tab' });
assert.deepEqual(pulses, [8]);
console.log(
  'Menu haptics: one 8ms explicit coarse-pointer pulse; reduced motion, unsupported/throwing API, synthetic clicks, focus and load no-op.'
);
