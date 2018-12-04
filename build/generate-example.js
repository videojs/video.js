const path = require('path');
const fs = require('fs');
const sh = require('shelljs');
const pkg = require('../package.json');

const dest = path.join(__dirname, '..', 'docs', 'api');
const vjsFlash = path.join(__dirname, '..', 'node_modules', 'videojs-flash');
const vjsSwf = path.join('node_modules', 'videojs-swf');
const distDest = path.join(dest, 'dist');
const exampleDest = path.join(dest, 'test-example');
const vjsFlashDest = path.join(dest, vjsFlash, 'dist');
const swfDest = path.join(dest, vjsFlash, vjsSwf, 'dist');

const cleanupExample = function() {
  sh.rm('-rf', distDest);
  sh.rm('-rf', exampleDest);
  sh.rm('-rf', path.join(dest, 'node_modules'));
};

const generateExample = function({skipBuild} = {}) {
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

  const filepaths = sh.find(path.join(__dirname, '..', 'sandbox', '**', '*.*'))
    .filter((filepath) => path.extname(filepath) === '.example');

  // copy the sandbox example files
  filepaths.forEach(function(filepath) {
    const p = path.parse(filepath);

    sh.cp(filepath, path.join(exampleDest, p.name));
  });
};

generateExample({skipBuild: true});

module.exports = {
  cleanupExample,
  generateExample
};
