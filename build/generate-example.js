import path from 'path';
import fs from 'fs';
import sh from 'shelljs';
import klawSync from 'klaw-sync';
import pkg from '../package.json';

const dest = 'docs/api/';
const vjsFlash = 'node_modules/videojs-flash';
const vjsSwf = 'node_modules/videojs-swf/';
const distDest = path.join(dest, 'dist');
const exampleDest = path.join(dest, 'test-example');
const vjsFlashDest = path.join(dest, vjsFlash, 'dist');
const swfDest = path.join(dest, vjsFlash, vjsSwf, 'dist');

export function cleanupExample() {
  sh.rm('-rf', distDest);
  sh.rm('-rf', exampleDest);
  sh.rm('-rf', path.join(dest, 'node_modules'));
}

export default function generateExample({skipBuild} = {}) {
  // run the build
  if (!skipBuild) {
    sh.exec('npm run build');
  }

  // make sure that the example, flash, and swf dests are available
  sh.mkdir('-p', exampleDest);
  sh.mkdir('-p', vjsFlashDest);
  sh.mkdir('-p', swfDest);

  // copy the `dist` dir
  sh.cp('-R', 'dist', path.join(dest, 'dist'));
  sh.rm(path.join(dest, 'dist', `video-js-${pkg.version}.zip`));

  // copy videojs-flash
  sh.cp(path.join(vjsFlash, 'dist', 'videojs-flash.js'), vjsFlashDest);
  // copy videojs-swf
  if (fs.existsSync(path.join(vjsFlash, vjsSwf, 'dist', 'video-js.swf'))) {
    sh.cp(path.join(vjsFlash, vjsSwf, 'dist', 'video-js.swf'), swfDest);
  } else {
    sh.cp(path.join(vjsSwf, 'dist', 'video-js.swf'), swfDest);
  }

  const files = klawSync('sandbox/').filter((file) => path.extname(file.path) === '.example');

  // copy the sandbox example files
  files.forEach(function(file) {
    const p = path.parse(file.path);
    sh.cp(file.path, path.join(exampleDest, p.name));
  });
}
