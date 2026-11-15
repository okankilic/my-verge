// Run by .githooks/post-commit: bumps the version after each commit and amends it into that commit.
// A feat: subject bumps minor, anything else bumps patch. Set SKIP_VERSION_BUMP=1 to skip once.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['package.json', 'ios/App/App.xcodeproj/project.pbxproj'];

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const skip = (why) => {
  if (why) console.log(`Version bump skipped: ${why}`);
  process.exit(0);
};

if (process.env.WISHCRUMBS_BUMPING === '1') skip();
if (process.env.SKIP_VERSION_BUMP === '1') skip('SKIP_VERSION_BUMP is set.');

const gitDir = resolve(root, git('rev-parse', '--git-dir'));
for (const marker of ['rebase-merge', 'rebase-apply', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'MERGE_HEAD']) {
  if (existsSync(join(gitDir, marker))) skip(`${marker} in progress.`);
}

const parents = git('rev-list', '--parents', '-n1', 'HEAD').split(/\s+/).length - 1;
if (parents === 0) skip('first commit.');
if (parents > 1) skip('merge commit.');

const pkgDiff = git('diff', 'HEAD~1', 'HEAD', '--', 'package.json');
if (/^[-+]\s*"version"\s*:\s*"\d+\.\d+\.\d+"/m.test(pkgDiff)) skip();

if (git('status', '--porcelain', '--', ...FILES)) {
  skip(`${FILES.join(' or ')} has uncommitted changes. Run "bun run version patch|minor" by hand.`);
}

const subject = git('log', '-1', '--format=%s');
const part = /^feat(\([^)]*\))?!?:/.test(subject) ? 'minor' : 'patch';

try {
  const out = execFileSync(process.execPath, [join(root, 'scripts/version.mjs'), part], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  git('add', '--', ...FILES);
  execFileSync('git', ['commit', '--amend', '--no-edit', '--no-verify', '--quiet'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, WISHCRUMBS_BUMPING: '1' },
  });
  console.log(out);
} catch (err) {
  try {
    git('checkout', 'HEAD', '--', ...FILES);
  } catch {}
  console.error(`Version bump skipped: ${(err.stderr || err.message || '').toString().trim()}`);
}
