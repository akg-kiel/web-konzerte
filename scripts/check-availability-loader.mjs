import { existsSync, readFileSync } from 'node:fs';

import ts from 'typescript';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'cloudflare:workers')
    return { url: 'test:cloudflare-workers', shortCircuit: true };

  if (specifier.startsWith('@/')) {
    const file = new URL(`../src/${specifier.slice(2)}`, import.meta.url);
    for (const extension of ['.tsx', '.ts']) {
      const candidate = new URL(file.href + extension);
      if (existsSync(candidate)) return { url: candidate.href, shortCircuit: true };
    }
  }

  return nextResolve(
    specifier === '../../lib/availability' ? `${specifier}.ts` : specifier,
    context
  );
}

export async function load(url, context, nextLoad) {
  if (url === 'test:cloudflare-workers')
    return { format: 'module', source: 'export const env = {};', shortCircuit: true };

  if (url.endsWith('.tsx'))
    return {
      format: 'module',
      source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX }
      }).outputText,
      shortCircuit: true
    };

  return nextLoad(url, context);
}
