#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const configPath = join(root, 'context.config.json');
const textExtensions = new Set([
  '.astro',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
  '.yaml'
]);
const skipDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  '.astro',
  '.wrangler',
  '.a5c/runs',
  '.a5c/node_modules'
]);
const failures = [];
const notes = [];

function report(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  failures.push(message);
}

function toAbsolute(path) {
  return join(root, path);
}

function readText(path) {
  return readFileSync(toAbsolute(path), 'utf8');
}

function isSkipped(path) {
  const normalized = path.replaceAll('\\\\', '/');
  if (/^\.a5c\/processes\/[^/]+\//.test(normalized)) return true;
  for (const skip of skipDirs) {
    if (normalized === skip || normalized.startsWith(`${skip}/`)) return true;
  }
  return false;
}

function extension(path) {
  const index = path.lastIndexOf('.');
  return index === -1 ? '' : path.slice(index);
}

function collectFiles(path) {
  const absolute = toAbsolute(path);
  if (!existsSync(absolute)) {
    fail(`missing scan path: ${path}`);
    return [];
  }

  const stats = statSync(absolute);
  if (stats.isFile()) return [path];
  if (!stats.isDirectory()) return [];

  const files = [];
  const stack = [path];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || isSkipped(current)) continue;
    for (const entry of readdirSync(toAbsolute(current))) {
      const child = `${current}/${entry}`;
      if (isSkipped(child)) continue;
      const childStats = statSync(toAbsolute(child));
      if (childStats.isDirectory()) stack.push(child);
      else if (textExtensions.has(extension(child))) files.push(child);
    }
  }
  return files;
}

function checkBudget(entry, group) {
  const path = entry.path;
  const absolute = toAbsolute(path);
  if (!existsSync(absolute)) {
    fail(`missing ${group} file: ${path}`);
    return;
  }

  const content = readText(path);
  const bytes = Buffer.byteLength(content);
  const lines = content.split('\n').length;
  if (entry.maxBytes && bytes > entry.maxBytes) {
    fail(`${path} exceeds ${group} byte budget: ${bytes}/${entry.maxBytes}`);
  }
  if (entry.maxLines && lines > entry.maxLines) {
    fail(`${path} exceeds ${group} line budget: ${lines}/${entry.maxLines}`);
  }
  notes.push(`${path}: ${bytes} bytes, ${lines} lines (${entry.purpose ?? group})`);
}

function checkRequiredFiles(config) {
  for (const path of config.requiredFiles ?? []) {
    if (!existsSync(toAbsolute(path))) fail(`missing required context file: ${path}`);
  }
}

function checkRequiredIgnores(config) {
  for (const item of config.requiredIgnoreLines ?? []) {
    if (!existsSync(toAbsolute(item.file))) {
      fail(`missing ignore file: ${item.file}`);
      continue;
    }
    const lines = readText(item.file).split('\n');
    for (const expected of item.lines ?? []) {
      if (!lines.includes(expected)) fail(`${item.file} is missing ignore line: ${expected}`);
    }
  }
}

function checkStalePatterns(config) {
  for (const rule of config.stalePatterns ?? []) {
    const regex = new RegExp(rule.pattern, 'i');
    for (const scanPath of rule.paths ?? []) {
      for (const file of collectFiles(scanPath)) {
        const content = readText(file);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (regex.test(line)) fail(`${rule.name}: ${file}:${index + 1}: ${line.trim()}`);
        });
      }
    }
  }
}

function checkStartupPhrases(config) {
  const startupText = readText('AGENTS.md');
  for (const phrase of config.requiredStartupPhrases ?? []) {
    if (!startupText.includes(phrase)) fail(`AGENTS.md missing required phrase: ${phrase}`);
  }
}

if (!existsSync(configPath)) {
  fail('missing context.config.json');
} else {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  for (const entry of config.startupFiles ?? []) checkBudget(entry, 'startup');
  for (const entry of config.lazyFiles ?? []) checkBudget(entry, 'lazy');
  checkRequiredFiles(config);
  checkRequiredIgnores(config);
  checkStalePatterns(config);
  checkStartupPhrases(config);
}

report('Context audit');
for (const note of notes) report(`- ${note}`);

if (failures.length > 0) {
  report('\nFailures:');
  for (const message of failures) report(`- ${message}`);
  process.exitCode = 1;
} else {
  report('\npass: context budgets, routing files, ignore rules, and stale-command scans are clean');
}
