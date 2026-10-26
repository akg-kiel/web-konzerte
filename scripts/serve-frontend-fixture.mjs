import { spawn } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

// Isolated built Worker: no secrets, mail binding, writes, or external fetches.
const require = createRequire(import.meta.url);
const root = await mkdtemp(join(tmpdir(), 'frontend-fixture-'));
await cp('dist', join(root, 'dist'), { recursive: true });
const config = JSON.parse(await readFile('dist/server/wrangler.json', 'utf8'));
const year = new Date().getFullYear() + 1;
const rows = [
  { id: 90001, title: 'Synthetisches Konzert mit Ticket', start: `${year}-08-06`, image: true },
  { id: 90002, title: 'Synthetisches Konzert ohne Ticket', start: `${year}-08-07` },
  { id: 90003, title: 'Synthetisches Archivkonzert', start: '2020-08-06', image: true }
].map(({ id, title, start, image }) => ({
  appointment: {
    base: {
      id,
      title,
      description:
        'Programm: Synthetisches Testprogramm\nMitwirkende: Testensemble\nOrt: Petruskirche Kiel',
      link: id === 90001 ? 'https://tickets.example.invalid/test' : undefined,
      image: image
        ? {
            imageUrl: 'https://akg-kiel.church.tools/synthetic-poster.jpg',
            imageMetadata: { aspectRatio: 4 / 3 },
            description: 'Synthetisches Konzertplakat'
          }
        : undefined
    },
    calculated: { startDate: start + 'T17:30:00Z', endDate: start + 'T19:30:00Z' }
  }
}));
await writeFile(
  join(root, 'dist/server/fixture.mjs'),
  `import worker from './entry.mjs';
globalThis.fetch = async request => {
  const url = new URL(typeof request === 'string' ? request : request.url);
  if (url.origin === 'https://akg-kiel.church.tools' && url.pathname.startsWith('/api/calendars/')) return Response.json({data: ${JSON.stringify(rows)}});
  return new Response('External networking blocked by local fixture', {status:502});
};
export default { fetch(request, env, ctx) {
  if (request.method !== 'GET') return new Response('No writes in this fixture', {status:405});
  return worker.fetch(request, env, ctx);
}};`
);
await writeFile(
  join(root, 'wrangler.json'),
  JSON.stringify({
    name: 'frontend-fixture',
    main: 'dist/server/fixture.mjs',
    compatibility_date: config.compatibility_date,
    compatibility_flags: config.compatibility_flags,
    rules: config.rules,
    no_bundle: true,
    images: { binding: 'IMAGES' },
    assets: { directory: './dist', binding: 'ASSETS', run_worker_first: true },
    vars: { ...config.vars, CHURCHTOOLS_TOKEN: '', TURNSTILE_SECRET: '' }
  })
);
const wrangler = resolve(dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js');
const child = spawn(
  process.execPath,
  [
    wrangler,
    'dev',
    '--config',
    join(root, 'wrangler.json'),
    '--local',
    '--port',
    '8793',
    '--inspector-port',
    '0',
    '--ip',
    '127.0.0.1',
    '--env-file',
    '/dev/null'
  ],
  { cwd: root, env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }, stdio: 'inherit' }
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.once('exit', async (code) => {
  await rm(root, { recursive: true, force: true });
  process.exitCode = code ?? 0;
});
