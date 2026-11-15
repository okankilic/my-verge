// Sets the app version. package.json is the source of truth; this copies it into the iOS project
// (Android's build.gradle reads package.json itself).
//   node scripts/version.mjs              sync iOS to the current version
//   node scripts/version.mjs patch|minor|major
//   node scripts/version.mjs 1.4.2
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(root, 'package.json');
const pbxPath = join(root, 'ios/App/App.xcodeproj/project.pbxproj');

const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

const parse = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) fail(`"${v}" isn't a version like 1.2.3.`);
  const parts = m.slice(1).map(Number);
  // Android's versionCode is major*10000 + minor*100 + patch, so minor and patch must stay below 100.
  if (parts[1] > 99 || parts[2] > 99) fail(`Minor and patch must be below 100 (got ${v}).`);
  return parts;
};

const pkgText = readFileSync(pkgPath, 'utf8');
const current = JSON.parse(pkgText).version;
const [maj, min, pat] = parse(current);

const arg = process.argv[2];
let next;
if (!arg) next = current;
else if (arg === 'major') next = `${maj + 1}.0.0`;
else if (arg === 'minor') next = `${maj}.${min + 1}.0`;
else if (arg === 'patch') next = `${maj}.${min}.${pat + 1}`;
else next = arg;
parse(next);

if (next !== current) {
  const updated = pkgText.replace(/("version"\s*:\s*")[^"]*(")/, `$1${next}$2`);
  writeFileSync(pkgPath, updated);
}

const pbx = readFileSync(pbxPath, 'utf8');
const pbxUpdated = pbx.replace(/MARKETING_VERSION = [^;]*;/g, `MARKETING_VERSION = ${next};`);
if (pbxUpdated !== pbx) writeFileSync(pbxPath, pbxUpdated);

console.log(next === current ? `Version ${next} (iOS synced)` : `Version ${current} → ${next}`);
