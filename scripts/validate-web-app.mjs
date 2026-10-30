import fs from 'node:fs';
import path from 'node:path';

const fail = [];
const read = file => fs.readFileSync(file, 'utf8');
const data = read('www/assets/data.js');
const urls = [...data.matchAll(/url:\s*["']([^"']+\.html)["']/g)].map(match => match[1]);
const uniqueUrls = [...new Set(urls)];

if (urls.length === 0) fail.push('No exam URLs were found in www/assets/data.js.');

for (const url of uniqueUrls) {
  const target = path.join('www', url);
  if (!fs.existsSync(target)) {
    fail.push('Missing exam file: ' + target);
    continue;
  }

  const html = read(target);
  const match = html.match(/(?:var|const|let)\s+questions\s*=\s*(\[[\s\S]*?\]);/m);
  if (!match) {
    fail.push('No questions array found: ' + target);
    continue;
  }

  try {
    const questions = new Function('return ' + match[1])();
    if (!Array.isArray(questions) || questions.length === 0) {
      fail.push('Empty or invalid questions array: ' + target);
    }
  } catch (error) {
    fail.push('Question array parse failed in ' + target + ': ' + error.message);
  }
}

for (const required of [
  'www/assets/omr-processor.js',
  'www/assets/gemini-omr-proxy.js',
  'www/assets/exam-engine.js',
  'www/assets/app-sync.js',
  'www/assets/updater.js'
]) {
  if (!fs.existsSync(required)) fail.push('Missing required app asset: ' + required);
}

const index = read('www/index.html');
for (const match of index.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
  const asset = match[1];
  if (/^(?:https?:)?\/\//i.test(asset) || asset.startsWith('data:') || asset.startsWith('#')) continue;
  const relative = asset.replace(/^\.\//, '').replace(/^\//, '').split(/[?#]/)[0];
  if (relative && !fs.existsSync(path.join('www', relative))) {
    fail.push('Missing local index asset: www/' + relative);
  }
}

const pkg = JSON.parse(read('package.json'));
const version = JSON.parse(read('www/version.json')).version;
const expectedVersion = pkg.version.split('.').map(part => part.padStart(2, '0')).join('.');
if (version !== expectedVersion) fail.push('Version mismatch: package=' + pkg.version + ', www/version.json=' + version);

const serviceWorker = read('www/service-worker.js');
if (!serviceWorker.includes("key.startsWith('medical-secret-files-shell-')")) {
  fail.push('Service worker cache cleanup is not scoped to this app.');
}
if (!serviceWorker.includes("'./assets/omr-processor.js'") || !serviceWorker.includes("'./assets/gemini-omr-proxy.js'")) {
  fail.push('OMR dependencies are not included in the offline app shell.');
}

if (fail.length) {
  console.error('Medical Secret Files validation failed:');
  for (const issue of fail) console.error(' - ' + issue);
  process.exitCode = 1;
} else {
  console.log('Validated ' + urls.length + ' catalog entries across ' + uniqueUrls.length + ' question files.');
}
