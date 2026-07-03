import { access, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

async function loadLocalEnv() {
  try {
    const text = await readFile(path.join(root, '.env'), 'utf8');
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

await loadLocalEnv();

const target = process.env.OD_PROJECT_DIR || process.env.OPENDESIGN_PROJECT_DIR;
if (!target) {
  console.error('Set OD_PROJECT_DIR to the OpenDesign project folder.');
  process.exit(1);
}

const dist = path.join(root, 'dist');
const targetDir = path.resolve(target);
const openDesignAgent = `# OpenDesign Bridge

Dieses Verzeichnis zeigt den gebauten Stand. Source of truth:

\`C:\\Users\\noah.zepner\\Dev\\web-konzerte\`

Nicht die generierten HTML-/Asset-Dateien hier bearbeiten. Fuer Website-Aenderungen:

1. In \`C:\\Users\\noah.zepner\\Dev\\web-konzerte\` arbeiten.
2. Source in \`src/\` aendern.
3. \`mise run quality\` ausfuehren.
4. \`mise run od\` ausfuehren, um OpenDesign neu zu deployen.

Reihenfolge bleibt: \`mise\` -> \`vp\` -> \`package.json\`.
`;
const keep = new Set([
  'AGENTS.md',
  'index.html.artifact.json',
  'nordic-resonance-designsystem.html.artifact.json',
  'web-konzerte'
]);

async function eachFile(dir, fn) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await eachFile(file, fn);
    } else {
      await fn(file);
    }
  }
}

function relRoot(file) {
  const from = path.dirname(file);
  const rel = path.relative(from, targetDir).replaceAll(path.sep, '/');
  return rel ? `${rel}/` : '';
}

function localizePath(file, url) {
  if (!url.startsWith('/') || url.startsWith('//')) return url;

  const [pathname, suffix = ''] = url.split(/(?=[?#])/, 2);
  const relativeRoot = relRoot(file);
  if (pathname === '/') return `${relativeRoot}index.html${suffix}`;

  const target = pathname.slice(1);
  const hasExtension = path.extname(target) !== '';
  const localized = hasExtension ? target : `${target.replace(/\/$/, '')}/index.html`;
  return `${relativeRoot}${localized}${suffix}`;
}

async function localizeOpenDesignUrls() {
  await eachFile(targetDir, async (file) => {
    if (!/\.(html|css)$/.test(file)) return;

    let text = await readFile(file, 'utf8');
    text = text.replace(/\b(href|src)=["'](\/[^"']*)["']/g, (_, attr, url) => {
      return `${attr}="${localizePath(file, url)}"`;
    });
    text = text.replace(/\bsrcset=["']([^"']*)["']/g, (_, value) => {
      const next = value.replace(/(^|,\s*)(\/\S+)/g, (_, lead, url) => {
        return `${lead}${localizePath(file, url)}`;
      });
      return `srcset="${next}"`;
    });
    text = text.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g, (_, quote, url) => {
      return `url(${quote}${localizePath(file, url)}${quote})`;
    });

    await writeFile(file, text);
  });
}

if (targetDir === root || targetDir.startsWith(root + path.sep)) {
  console.error('Refusing to deploy into the source repo.');
  process.exit(1);
}

await access(path.join(dist, 'index.html'));
await mkdir(targetDir, { recursive: true });

for (const entry of await readdir(targetDir, { withFileTypes: true })) {
  if (keep.has(entry.name)) continue;
  await rm(path.join(targetDir, entry.name), { recursive: true, force: true });
}

await cp(dist, targetDir, { recursive: true });
await localizeOpenDesignUrls();
await writeFile(path.join(targetDir, 'AGENTS.md'), openDesignAgent);
await cp(path.join(root, 'DESIGN.md'), path.join(targetDir, 'DESIGN.md'));
console.log(`Deployed dist/ to ${targetDir}`);
