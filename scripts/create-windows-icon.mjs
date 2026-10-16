import fs from 'node:fs/promises';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const svgPath = 'www/assets/icon.svg';
const icoPath = 'www/assets/icon.ico';
const svg = await fs.readFile(svgPath);
const png = await sharp(svg).resize(256, 256).png().toBuffer();
const ico = await pngToIco(png);
await fs.writeFile(icoPath, ico);
console.log('Created Windows app icon:', icoPath);
