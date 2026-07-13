#!/usr/bin/env node
'use strict';

const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/$/, '');
const { spawn } = require('child_process');

function die(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

function printUsage() {
  process.stdout.write(
    'snip — tiny URL shortener CLI\n\n' +
    'Usage:\n' +
    '  snip add <url>     Shorten a URL and print the short link\n' +
    '  snip ls            List all short links\n' +
    '  snip open <code>   Open a short link in the OS browser\n' +
    '\n' +
    'Config:\n' +
    '  SNIP_API  Backend base URL (default: http://localhost:3000)\n'
  );
}

async function cmdAdd(url) {
  if (!url) die('Usage: snip add <url>');

  let res;
  try {
    res = await fetch(`${BASE}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  } catch (err) {
    die(`Cannot reach backend at ${BASE}: ${err.message}`);
  }

  let body;
  try { body = await res.json(); } catch { body = {}; }

  if (!res.ok) die(body.error || `Server error ${res.status}`);

  process.stdout.write(body.shortUrl + '\n');
}

async function cmdLs() {
  let res;
  try {
    res = await fetch(`${BASE}/api/links`);
  } catch (err) {
    die(`Cannot reach backend at ${BASE}: ${err.message}`);
  }

  let links;
  try { links = await res.json(); } catch { links = null; }

  if (!res.ok || !Array.isArray(links)) die(`Server error ${res.status}`);

  if (links.length === 0) {
    process.stdout.write('No links yet.\n');
    return;
  }

  const cw = Math.max(4, ...links.map(l => l.code.length));
  const hw = Math.max(4, ...links.map(l => String(l.hits).length));

  const row = (code, hits, url) =>
    code.padEnd(cw) + '  ' + String(hits).padStart(hw) + '  ' + url;

  process.stdout.write(row('CODE', 'HITS', 'URL') + '\n');
  process.stdout.write('\u2500'.repeat(cw + hw + 4 + 48) + '\n');
  for (const l of links) process.stdout.write(row(l.code, l.hits, l.url) + '\n');
}

async function cmdOpen(code) {
  if (!code) die('Usage: snip open <code>');

  let res;
  try {
    res = await fetch(`${BASE}/${code}`, { redirect: 'manual' });
  } catch (err) {
    die(`Cannot reach backend at ${BASE}: ${err.message}`);
  }

  if (res.status === 404) die(`Unknown code: ${code}`);

  const location = res.headers.get('location');
  if (!location) die(`No redirect returned for code: ${code} (status ${res.status})`);

  let cmd, args;
  if (process.platform === 'win32') {
    cmd = 'cmd'; args = ['/c', 'start', '', location];
  } else if (process.platform === 'darwin') {
    cmd = 'open'; args = [location];
  } else {
    cmd = 'xdg-open'; args = [location];
  }

  spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
  process.stdout.write(`Opening ${location}\n`);
}

const [,, cmd, arg] = process.argv;

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
  printUsage();
} else if (cmd === 'add') {
  cmdAdd(arg).catch(err => die(err.message));
} else if (cmd === 'ls') {
  cmdLs().catch(err => die(err.message));
} else if (cmd === 'open') {
  cmdOpen(arg).catch(err => die(err.message));
} else {
  process.stderr.write(`Unknown command: ${cmd}\n\n`);
  printUsage();
  process.exit(1);
}
