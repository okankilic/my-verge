// Renders the Willa brand SVGs (assets/brand/*.svg) and the PNG masters that
// @capacitor/assets turns into native icons and splash screens.
// Run from the repo root: node assets/brand/render.mjs && npx capacitor-assets generate --android --ios
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const INK = '#16161A';
const NIGHT = '#0E0E11';
const PAPER = '#F6F6F8';
const ACCENT = '#5B3FD9';

// The mark on a 100×100 grid: a monoline W (the path) with a violet dot over
// its middle peak (the wish riding on it). TopNav.tsx inlines the same shapes.
const mark = (fg) =>
  `<polyline points="22,40 36,72 50,46 64,72 78,40" stroke="${fg}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
  `<circle cx="50" cy="27" r="6.5" fill="${ACCENT}"/>`;

// Places the 100-unit mark at `scale` px per unit, centred on a `size` canvas
const svg = (size, scale, fg, bg, radius = 0) => {
  const offset = (size - 100 * scale) / 2;
  const fill = bg ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${fill}<g transform="translate(${offset} ${offset}) scale(${scale})">${mark(fg)}</g></svg>`;
};

const files = {
  'mark.svg': svg(100, 1, INK, null),
  'mark-light.svg': svg(100, 1, PAPER, null),
  'icon.svg': svg(1024, 9, PAPER, INK),
  // Adaptive-icon foreground: the mark stays inside the 66% safe zone
  'icon-foreground.svg': svg(1024, 6.4, PAPER, null),
  'icon-background.svg': svg(1024, 0, PAPER, INK).replace(/<g[\s\S]*<\/g>/, ''),
  'splash.svg': svg(2732, 8.5, INK, PAPER),
  'splash-dark.svg': svg(2732, 8.5, PAPER, NIGHT),
  'favicon.svg': svg(64, 0.64, PAPER, INK, 14),
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(`assets/brand/${name}`, content);
}

const png = (name, out, size) =>
  sharp(Buffer.from(files[name])).resize(size, size).png().toFile(out);

await Promise.all([
  png('icon.svg', 'assets/icon-only.png', 1024),
  png('icon-foreground.svg', 'assets/icon-foreground.png', 1024),
  png('icon-background.svg', 'assets/icon-background.png', 1024),
  png('splash.svg', 'assets/splash.png', 2732),
  png('splash-dark.svg', 'assets/splash-dark.png', 2732),
  png('icon.svg', 'public/apple-touch-icon.png', 180),
]);
writeFileSync('public/favicon.svg', files['favicon.svg']);
console.log('Brand assets rendered.');
