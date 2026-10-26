import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync('src/components/sections/ConcertShare.astro', 'utf8');
const script = ts.transpileModule(source.match(/<script>([\s\S]*?)<\/script>/)[1], {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }
}).outputText;
const url = 'https://petruskirche.events/programm/ein-konzert-123/';
const title = 'Ein Konzert & Gäste';
const page = readFileSync('src/pages/programm/[slug].astro', 'utf8');
assert(page.includes('<ConcertShare title={concert.title} url={canonicalUrl!} />'));
assert(source.includes('type="url" value={url} readonly'), 'Manual copy is available without JS.');

function setup(navigator) {
  const handlers = {};
  const nodes = {
    details: { open: false },
    summary: {
      addEventListener: (name, handler) => {
        handlers.share = handler;
      }
    },
    input: {
      value: url,
      focus() {
        this.focused = true;
      },
      select() {
        this.selected = true;
      }
    },
    button: {
      hidden: true,
      addEventListener: (name, handler) => {
        handlers.copy = handler;
      }
    },
    '[role="status"]': { textContent: '' }
  };
  let Component;
  runInNewContext(script, {
    navigator,
    DOMException,
    HTMLElement: class {
      dataset = { title };
      querySelector(selector) {
        return nodes[selector];
      }
    },
    customElements: {
      get: () => undefined,
      define: (name, value) => {
        Component = value;
      }
    }
  });
  const component = new Component();
  component.connectedCallback();
  // Reconnection must not register duplicate listeners.
  component.connectedCallback();
  return { nodes, handlers, share: () => handlers.share({ preventDefault() {} }) };
}

let payload;
let fixture = setup({
  share: async (data) => {
    payload = data;
  }
});
await fixture.share();
assert.equal(payload.title, title);
assert.equal(payload.url, url);
assert.match(fixture.nodes['[role="status"]'].textContent, /übergeben/);
for (const name of ['AbortError', 'NotAllowedError', 'TypeError']) {
  fixture = setup({
    share: async () => {
      throw new DOMException('Test', name);
    }
  });
  await fixture.share();
  if (name === 'AbortError') {
    assert.equal(fixture.nodes.details.open, false);
    assert.equal(fixture.nodes['[role="status"]'].textContent, 'Teilen abgebrochen.');
  } else {
    assert(
      fixture.nodes.details.open && fixture.nodes.input.selected && fixture.nodes.input.focused
    );
    assert.match(fixture.nodes['[role="status"]'].textContent, /Teilen nicht möglich/);
  }
}
let copied;
fixture = setup({
  clipboard: {
    writeText: async (value) => {
      copied = value;
    }
  }
});
await fixture.share();
assert.equal(copied, url);
assert.equal(fixture.nodes['[role="status"]'].textContent, 'Veranstaltungslink kopiert.');
for (const navigator of [
  {},
  {
    clipboard: {
      writeText: async () => {
        throw Error('Denied');
      }
    }
  }
]) {
  fixture = setup(navigator);
  await fixture.share();
  assert(fixture.nodes.details.open && fixture.nodes.input.selected && fixture.nodes.input.focused);
  assert.match(fixture.nodes['[role="status"]'].textContent, /manuell/);
}
let finish;
let calls = 0;
fixture = setup({
  share: () => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  }
});
const first = fixture.share();
await fixture.share();
assert.equal(calls, 1);
finish();
await first;
console.log(
  'Concert sharing: exact title/canonical URL, native success/abort/error, clipboard/missing/denied, manual selection and duplicate guard passed.'
);
