import fs from 'node:fs';

const packagePath = new URL('../package.json', import.meta.url);
const versionPath = new URL('../www/version.json', import.meta.url);
const serviceWorkerPath = new URL('../www/service-worker.js', import.meta.url);

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const parts = String(pkg.version || '5.10.8').split('.').map(Number);
if (parts.length !== 3 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 99)) {
  throw new Error('Expected a three-part version with each segment between 00 and 99.');
}

let [major, minor, patch] = parts;
if (patch < 99) {
  patch++;
} else if (minor < 99) {
  patch = 0;
  minor++;
} else if (major < 99) {
  patch = 0;
  minor = 0;
  major++;
} else {
  throw new Error('Version limit reached: no segment can exceed 99.');
}

pkg.version = [major, minor, patch].join('.');
const display = [major, minor, patch].map(n => String(n).padStart(2, '0')).join('.');
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
fs.writeFileSync(versionPath, JSON.stringify({ version: display }, null, 2) + '\n');

let serviceWorker = fs.readFileSync(serviceWorkerPath, 'utf8');
const cacheNamePattern = /const CACHE_NAME = ['"]medical-secret-files-shell-[^'"]+['"];/;
if (!cacheNamePattern.test(serviceWorker)) {
  throw new Error('Could not find this app service-worker cache name.');
}
serviceWorker = serviceWorker.replace(cacheNamePattern, `const CACHE_NAME = 'medical-secret-files-shell-${display}';`);
fs.writeFileSync(serviceWorkerPath, serviceWorker);

console.log('Updated Medical Secret Files to ' + display);
