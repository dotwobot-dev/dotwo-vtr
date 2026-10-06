const fs = require('node:fs');
const path = require('node:path');
const { run, TEAM, verifyApplication } = require('./macos-signing.cjs');
function verifyApp(appPath) {
  const plist = JSON.parse(run('plutil', ['-convert', 'json', '-o', '-', path.join(appPath,'Contents/Info.plist')], { stdoutOnly:true }));
  const arch = run('lipo',['-archs',path.join(appPath,'Contents/MacOS',plist.CFBundleExecutable)]).trim() === 'arm64' ? 'arm64' : 'x64';
  const files = verifyApplication(appPath,plist.LSMinimumSystemVersion,arch,true);
  return { version:plist.CFBundleShortVersionString, minimum:plist.LSMinimumSystemVersion, arch, teamId:TEAM, files };
}
function main() {
  const file = path.resolve(process.argv[2] || '');
  if (file.endsWith('.app')) return verifyApp(file);
  if (!file.endsWith('.dmg')) throw new Error('Usa app o DMG.');
  run('codesign',['--verify','--strict',file]);
  const details = run('codesign',['--display','--verbose=4',file]);
  if (!details.includes(`TeamIdentifier=${TEAM}`) || !/^Timestamp=/m.test(details)) throw new Error('Equipo o timestamp de DMG incorrectos.');
  run('spctl',['--assess','--verbose=2','--type','open','--context','context:primary-signature',file]);
  run('xcrun',['stapler','validate',file]);
  const mounted = JSON.parse(run('plutil',['-convert','json','-o','-','-'],{stdoutOnly:true,input:run('hdiutil',['attach','-readonly','-nobrowse','-plist',file],{stdoutOnly:true})}));
  const mount=mounted['system-entities'].find(e=>e['mount-point'])?.['mount-point'];
  if (!mount) throw new Error('Fallo al montar DMG.');
  try {
    if (fs.readlinkSync(path.join(mount,'Aplicaciones'))!=='/Applications') throw new Error('Enlace incorrecto.');
    return { dmg:file, ...verifyApp(path.join(mount,'DoTwo VTR.app')) };
  } finally { run('hdiutil',['detach',mount]); }
}
try { console.log(JSON.stringify(main(),null,2)); } catch(e) { console.error(e.message); process.exitCode=1; }
