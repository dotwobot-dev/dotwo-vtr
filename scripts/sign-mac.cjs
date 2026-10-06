const path = require('node:path');
const fs = require('node:fs');
const { run, walk, isMachO, verifyCode, TEAM } = require('./macos-signing.cjs');

// Explicitly sign nested code before bundles; vendor originals are never touched.
module.exports = async function sign(options) {
  const files = walk(options.app);
  const nested = files.filter(file => isMachO(file) || (fs.statSync(file).isDirectory() && /\.(app|framework)$/.test(file)));
  nested.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);
  const jit = path.resolve(__dirname, '../build/entitlements.mac.plist');
  for (const file of [...nested, options.app]) {
    const args = ['--force', '--sign', options.identity, '--options', 'runtime', '--timestamp'];
    // Signing a helper .app replaces its main executable's signature too.
    if (file.endsWith('.app') || (file.includes('/Contents/MacOS/') && !file.includes('/Resources/'))) args.push('--entitlements', jit);
    args.push(file);
    run('codesign', args);
    verifyCode(file, TEAM);
  }
  run('codesign', ['--verify', '--deep', '--strict', options.app]);
};
