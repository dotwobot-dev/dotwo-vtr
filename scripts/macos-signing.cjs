const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const TEAM = 'MR7VK26RP8';
function run(command, args, options = {}) {
  const { stdoutOnly = false, ...rest } = options;
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, LC_ALL: 'C' }, timeout: 60000, ...rest });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command}: ${(result.stderr || result.stdout || '').trim()}`);
  return stdoutOnly ? result.stdout : `${result.stdout || ''}${result.stderr || ''}`;
}
function parseIdentities(output) {
  return output.split('\n').flatMap(line => {
    const m = line.match(/^\s*\d+\)\s+([A-Fa-f0-9]{40})\s+"(Developer ID (Application|Installer): .+ \(([A-Z0-9]{10})\))"\s*$/);
    return m ? [{ hash: m[1], name: m[2], type: m[3], teamId: m[4] }] : [];
  });
}
function notaryArgs(signing) { return ['--keychain-profile', signing.profile]; }
function checkSigning(execute = run) {
  if (process.platform !== 'darwin') throw new Error('La firma requiere este host macOS.');
  for (const key of ['APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_API_KEY', 'APPLE_API_KEY_ID', 'APPLE_API_ISSUER', 'CSC_LINK', 'CSC_INSTALLER_LINK']) {
    if (process.env[key]) throw new Error(`Desactiva ${key}: se usa exclusivamente el Llavero local.`);
  }
  const identities = parseIdentities(execute('security', ['find-identity', '-v', '-p', 'basic']));
  const apps = identities.filter(i => i.type === 'Application' && i.teamId === TEAM);
  const installers = identities.filter(i => i.type === 'Installer' && i.teamId === TEAM);
  if (apps.length !== 1) throw new Error(`Se requiere una identidad Developer ID Application de ${TEAM}.`);
  if (installers.length !== 1) throw new Error(`Se requiere una identidad Developer ID Installer de ${TEAM}.`);
  const signing = { teamId: TEAM, application: apps[0], installer: installers[0], profile: 'dotwo-notary' };
  const history = JSON.parse(execute('xcrun', ['notarytool', 'history', ...notaryArgs(signing), '--output-format', 'json'], { stdoutOnly: true }));
  if (!Array.isArray(history.history)) throw new Error('Perfil de notarizacion no accesible.');
  return signing;
}
function walk(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(root, entry.name);
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? [file, ...walk(file)] : [file];
  });
}
function isMachO(file) {
  if (!fs.statSync(file).isFile()) return false;
  const fd = fs.openSync(file, 'r');
  const bytes = Buffer.alloc(4);
  try { fs.readSync(fd, bytes, 0, 4, 0); } finally { fs.closeSync(fd); }
  return ['cffaedfe', 'cefaedfe', 'feedfacf', 'feedface', 'cafebabe', 'bebafeca', 'cafebabf'].includes(bytes.toString('hex'));
}
function verifyCode(file, team = TEAM) {
  run('codesign', ['--verify', '--strict', '--verbose=2', file]);
  const details = run('codesign', ['--display', '--verbose=4', file]);
  if (!details.includes(`TeamIdentifier=${team}`) || !/^Timestamp=/m.test(details) || !/flags=.*\bruntime\b/.test(details)) {
    throw new Error(`Firma sin equipo/runtime/timestamp esperado: ${file}`);
  }
  return details.match(/^CDHash=([a-f0-9]+)$/m)?.[1];
}
function versionNumber(v) { return v.split('.').reduce((n, p, i) => n + Number(p) / 100 ** i, 0); }
function verifyApplication(appPath, minimum, arch, notarized = false) {
  const records = [];
  for (const file of walk(appPath).filter(isMachO)) {
    const codeHash = verifyCode(file);
    if (file.includes('/Contents/MacOS/') && !file.includes('/Resources/')) {
      const entitlements = run('codesign', ['--display', '--entitlements', '-', file]);
      if (!entitlements.includes('com.apple.security.cs.allow-jit')) throw new Error(`Electron sin permiso JIT: ${file}`);
      if (entitlements.includes('allow-unsigned-executable-memory') || entitlements.includes('disable-library-validation')) throw new Error(`Entitlements innecesariamente amplios: ${file}`);
    }
    const architectures = run('lipo', ['-archs', file]).trim();
    if (!architectures.split(' ').includes(arch === 'x64' ? 'x86_64' : arch)) throw new Error(`Arquitectura incorrecta: ${file}`);
    // otool treats '(GPU)' in Electron helper filenames as archive-member syntax.
    const aliasDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vtr-macho-'));
    const alias = path.join(aliasDir, 'binary');
    fs.symlinkSync(file, alias);
    let loads, libraries;
    try {
      loads = run('otool', ['-l', alias]);
      libraries = run('otool', ['-L', alias]).split('\n').slice(1).join('\n');
    } finally { fs.rmSync(aliasDir, { recursive: true, force: true }); }
    // Only deployment commands have a bare version/minos followed by sdk.
    const deployment = [...loads.matchAll(/cmd LC_(?:VERSION_MIN_MACOSX|BUILD_VERSION)[\s\S]*?(?:minos|\bversion)\s+(\d+\.\d+(?:\.\d+)?)/g)].map(m => m[1]);
    if (!deployment.length || deployment.some(v => versionNumber(v) > versionNumber(minimum))) throw new Error(`Minimo real superior a ${minimum}: ${file}: ${deployment}`);
    if (/\/(?:opt\/homebrew|usr\/local|Users)\//.test(libraries)) throw new Error(`Dependencia externa no portable: ${file}`);
    records.push({ path: path.relative(appPath, file), architectures, minimum: deployment, codeHash });
  }
  if (!records.some(r => r.path.endsWith('/ffmpeg')) || !records.some(r => r.path.endsWith('/ffprobe'))) throw new Error('Faltan binarios multimedia firmados.');
  verifyCode(appPath);
  run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath]);
  if (notarized) {
    const assessment = run('spctl', ['--assess', '--verbose=2', '--type', 'execute', appPath]);
    if (!assessment.includes('Notarized Developer ID')) throw new Error('Gatekeeper no reconoce notarizacion.');
    run('xcrun', ['stapler', 'validate', appPath]);
  }
  return records;
}
if (require.main === module) {
  try { console.log(JSON.stringify(checkSigning(), null, 2)); } catch (e) { console.error(e.message); process.exitCode = 1; }
}
module.exports = { TEAM, run, parseIdentities, notaryArgs, checkSigning, walk, isMachO, verifyCode, verifyApplication };
