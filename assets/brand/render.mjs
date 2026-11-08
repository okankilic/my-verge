// Renders the Wishcrumbs brand SVGs (assets/brand/*.svg) and the PNG masters that
// @capacitor/assets turns into native icons and splash screens.
// Run from the repo root: node assets/brand/render.mjs && npx capacitor-assets generate --android --ios
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const COCOA = '#493B35';
const FOREST = '#243D35';
const OAT = '#F4EDE2';
const CREAM = '#F4E8D4';
const TERRACOTTA = '#D98F6B';

// The mark on a 100×100 grid: four crumbs growing along a rising trail, the
// newest one Terracotta. TopNav.tsx inlines the same shapes.
const CRUMBS = [[14, 84, 8], [34, 70, 10.5], [60, 56, 13], [78, 25, 16.5]];
const mark = (fg) =>
  CRUMBS.map(([cx, cy, r], i) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${i === CRUMBS.length - 1 ? TERRACOTTA : fg}"/>`,
  ).join('');

// Places the 100-unit mark at `scale` px per unit, centred on a `size` canvas
const svg = (size, scale, fg, bg, radius = 0) => {
  const offset = (size - 100 * scale) / 2;
  const fill = bg ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${fill}<g transform="translate(${offset} ${offset}) scale(${scale})">${mark(fg)}</g></svg>`;
};

const files = {
  'mark.svg': svg(100, 1, COCOA, null),
  'mark-light.svg': svg(100, 1, CREAM, null),
  'icon.svg': svg(1024, 7.5, CREAM, FOREST),
  // Adaptive-icon foreground: the mark stays inside the 66% safe zone
  'icon-foreground.svg': svg(1024, 6, CREAM, null),
  'icon-background.svg': svg(1024, 0, CREAM, FOREST).replace(/<g[\s\S]*<\/g>/, ''),
  'splash.svg': svg(2732, 8.5, COCOA, OAT),
  'splash-dark.svg': svg(2732, 8.5, CREAM, FOREST),
  'favicon.svg': svg(64, 0.62, CREAM, FOREST, 14),
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
