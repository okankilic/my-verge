// Renders the Make It Real brand SVGs (assets/brand/*.svg) and the PNG masters that
// @capacitor/assets turns into native icons and splash screens.
// Run from the repo root: node assets/brand/render.mjs && npx capacitor-assets generate --android --ios
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const INK = '#1E1915';
const NIGHT = '#14110E';
const PAPER = '#FAF7F2';
const AMBER = '#D97706';

// The mark on a 100×100 grid: a ring (the wish) whose inside is filling with
// amber from the bottom (the wish becoming real)
const mark = (fg) =>
  `<defs><clipPath id="mir-fill"><circle cx="50" cy="50" r="28"/></clipPath></defs>` +
  `<rect x="0" y="42" width="100" height="58" fill="${AMBER}" clip-path="url(#mir-fill)"/>` +
  `<circle cx="50" cy="50" r="28" stroke="${fg}" stroke-width="8" fill="none"/>`;

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
