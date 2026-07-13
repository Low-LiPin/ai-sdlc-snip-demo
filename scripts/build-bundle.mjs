#!/usr/bin/env node
/**
 * scripts/build-bundle.mjs
 *
 * Regenerates the `bundle` submodule from the three source layers, then bumps
 * the submodule pointers on `main`.  Pass --push to also publish to GitHub.
 *
 * Safe to rerun: every git commit is guarded by a non-empty staged-diff check.
 * Cross-platform: npm/npx run through the shell so .cmd wrappers work on Windows.
 */

import { execSync }                                               from 'node:child_process';
import { copyFileSync, cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join }                                          from 'node:path';
import { fileURLToPath }                                          from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUSH = process.argv.includes('--push');

// ── helpers ──────────────────────────────────────────────────────────────────

/** Run a shell command, streaming output to the console. */
function run(cmd, cwd = ROOT) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

/** Run and return trimmed stdout. */
function capture(cmd, cwd = ROOT) {
  return execSync(cmd, { cwd, encoding: 'utf8', shell: true }).trim();
}

/**
 * Stage `paths` in `cwd`, then commit only when there is something staged.
 * Returns true if a commit was made (false = nothing changed = idempotent no-op).
 */
function commitIfChanged(cwd, message, paths = ['.']) {
  run(`git add ${paths.join(' ')}`, cwd);
  const diff = capture('git diff --cached --stat', cwd);
  if (!diff) {
    console.log(`  (nothing to commit — ${cwd})`);
    return false;
  }
  run(`git commit -m "${message}"`, cwd);
  return true;
}

// ── 1. Update the three source submodules to their branch tips ───────────────

console.log('\n═══ 1. Update source submodules ═══');
run('git submodule update --init --remote backend frontend cli');

// ── 2. Build the Angular frontend ────────────────────────────────────────────

console.log('\n═══ 2. Build frontend ═══');
const frontendDir = join(ROOT, 'frontend');
run('npm install', frontendDir);       // shell: true → uses npm.cmd on Windows
run('npx ng build', frontendDir);

const browserDir = join(frontendDir, 'dist', 'snip-frontend', 'browser');
if (!existsSync(join(browserDir, 'index.html'))) {
  console.error('\nERROR: frontend/dist/snip-frontend/browser/index.html missing!');
  process.exit(1);
}
console.log('  ✔ frontend build OK');

// ── 3. Assemble bundle/ ──────────────────────────────────────────────────────

console.log('\n═══ 3. Assemble bundle/ ═══');
const bundleDir = join(ROOT, 'bundle');
const publicDir = join(bundleDir, 'public');

// server.js — verbatim copy from backend
copyFileSync(join(ROOT, 'backend', 'server.js'), join(bundleDir, 'server.js'));

// cli.js — verbatim copy from cli
copyFileSync(join(ROOT, 'cli', 'cli.js'), join(bundleDir, 'cli.js'));

// public/ — clean copy of the Angular production build
if (existsSync(publicDir)) rmSync(publicDir, { recursive: true, force: true });
cpSync(browserDir, publicDir, { recursive: true });

// .env — Bun auto-loads this; switches the server into full-stack mode
writeFileSync(join(bundleDir, '.env'), 'PUBLIC_DIR=./public\n');

// package.json — NO "type" field so cli.js runs under plain `node`
writeFileSync(
  join(bundleDir, 'package.json'),
  JSON.stringify(
    { name: 'snip-bundle', version: '1.0.0', scripts: { start: 'bun server.js' } },
    null, 2
  ) + '\n'
);

// Dockerfile
writeFileSync(
  join(bundleDir, 'Dockerfile'),
  [
    'FROM oven/bun:1-alpine',
    'WORKDIR /app',
    'COPY . .',
    'ENV PORT=3000',
    'EXPOSE 3000',
    'CMD bun server.js',
    '',
  ].join('\n')
);

// .dockerignore
writeFileSync(join(bundleDir, '.dockerignore'), 'node_modules\n');

// railway.json
writeFileSync(
  join(bundleDir, 'railway.json'),
  JSON.stringify(
    {
      $schema: 'https://railway.app/railway.schema.json',
      build:   { builder: 'DOCKERFILE' },
      deploy:  { startCommand: 'bun server.js' },
    },
    null, 2
  ) + '\n'
);

console.log('  ✔ bundle/ assembled');

// ── 4. Commit the generated content inside bundle/ ───────────────────────────

console.log('\n═══ 4. Commit bundle/ ═══');
commitIfChanged(bundleDir, 'chore: rebuild bundle');

// ── 5. Bump submodule pointers in the superproject ───────────────────────────
//    Use explicit paths so the script file itself isn't swept up here.

console.log('\n═══ 5. Bump superproject pointers ═══');
commitIfChanged(ROOT, 'chore: bump submodule pointers', ['backend', 'frontend', 'cli', 'bundle']);

// ── 6. Publish (only with --push) ────────────────────────────────────────────

if (PUSH) {
  console.log('\n═══ 6. Push ═══');
  // bundle is in detached HEAD after submodule checkout; push explicitly by branch name
  run('git push origin HEAD:bundle', bundleDir);
  run('git push origin main');
  console.log('\n  ✔ pushed bundle + main');
} else {
  console.log('\n  (run with --push to publish)');
}

console.log('\n✔ Done.');
