import fs from 'node:fs';
const packagePath=new URL('../package.json',import.meta.url),versionPath=new URL('../www/version.json',import.meta.url);
const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8')),parts=String(pkg.version||'5.10.8').split('.').map(Number);
while(parts.length<3)parts.push(0);
let [major,minor,patch]=parts;
if(patch<99)patch++;else{patch=0;if(minor<99)minor++;else{minor=0;major++;}}
pkg.version=[major,minor,patch].join('.');
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
const display=[major,minor,patch].map(n=>String(n).padStart(2,'0')).join('.');
fs.writeFileSync(versionPath,JSON.stringify({version:display},null,2)+'\n');
console.log('Updated Medical Secret Files to '+display);
