import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const htmlFiles = new Set();

async function walk(dir) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', 'dist-win', 'deploy_out'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) htmlFiles.add(full);
  }
}
await walk(path.join(root, 'www'));
for (const file of ['index.html', 'login.html', 'sync.html']) {
  const full = path.join(root, file);
  try { if ((await fs.stat(full)).isFile()) htmlFiles.add(full); } catch {}
}

function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/[\t\r ]+/g, ' ').trim();
}

const sections = [];
for (const file of [...htmlFiles].sort()) {
  const content = visibleText(await fs.readFile(file, 'utf8'));
  const lines = content.split(/(?<=[।!?])\s+|\n+/).map(s => s.trim())
    .filter(s => /[\u0980-\u09FF]/.test(s) && s.length >= 2);
  if (lines.length) sections.push({ file: path.relative(root, file).split(path.sep).join('/'), text: lines.join('\n') });
}

const report = [
  '# Offline Bengali Spelling Review',
  '',
  'This report is generated locally with the open-source Bengali dictionary. No external AI API, network request, or API key is used by the checker itself.',
  '',
  'Scope: dictionary-based spelling suggestions only. This is not a full grammar/meaning model; Bengali grammar and context-sensitive corrections still require human review.',
  '',
  '## Files scanned',
  ...(sections.length ? sections.map(s => '- ' + s.file) : ['- No visible Bengali text was found in the scanned HTML files.']),
  ''
];

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'msf-bengali-proofread-'));
try {
  const fileMap = [];
  for (let i = 0; i < sections.length; i++) {
    const name = String(i + 1).padStart(4, '0') + '.txt';
    await fs.writeFile(path.join(tempDir, name), sections[i].text, 'utf8');
    fileMap.push({ name, source: sections[i].file });
  }

  if (fileMap.length) {
    const files = fileMap.map(item => path.join(tempDir, item.name));
    const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const result = spawnSync(executable, [
      '--no-install', 'cspell', 'lint',
      '--config', path.join(root, 'cspell.json'),
      '--no-progress', '--no-summary', '--format', 'default',
      ...files
    ], { cwd: root, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 });

    if (result.error) throw result.error;
    if (result.status !== 0 && result.status !== 1) {
      throw new Error('cspell could not run (exit ' + result.status + '): ' + (result.stderr || result.stdout || 'no details'));
    }
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    report.push('## Possible spelling issues', '');
    report.push(output || 'No spelling issues were reported by the local dictionary.', '');
    report.push('## Temporary-file mapping', '', ...fileMap.map(item => '- ' + item.name + ' → ' + item.source), '');
    report.push('Dictionary findings are suggestions, not proof of an error. Names, medical terms, borrowed words and valid regional variants may be flagged.');
  }
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}

await fs.writeFile(path.join(root, 'bengali-proofreading-report.md'), report.join('\n'), 'utf8');
console.log('Offline Bengali dictionary review finished. See bengali-proofreading-report.md');
