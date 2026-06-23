import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = resolve(__dirname, 'public');

const chipSvg = readFileSync(resolve(pub, 'favicon.svg'));
const ogSvg = readFileSync(resolve(pub, 'og-image.svg'));

const icons = [
  { svg: chipSvg, name: 'favicon-16.png',  w: 16,  h: 16 },
  { svg: chipSvg, name: 'favicon-32.png',  w: 32,  h: 32 },
  { svg: chipSvg, name: 'favicon-48.png',  w: 48,  h: 48 },
  { svg: chipSvg, name: 'icon-192.png',    w: 192, h: 192 },
  { svg: chipSvg, name: 'icon-512.png',    w: 512, h: 512 },
  { svg: chipSvg, name: 'apple-touch-icon.png', w: 180, h: 180 },
  { svg: ogSvg,   name: 'og-image.png',    w: 1200, h: 630 },
];

for (const { svg, name, w, h } of icons) {
  await sharp(svg).resize(w, h).png().toFile(resolve(pub, name));
  console.log(`✓ ${name} (${w}×${h})`);
}
console.log('\nAll icons generated!');
