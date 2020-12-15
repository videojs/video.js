const path = require('path');
const sh = require('shelljs');
const pkg = require('../package.json');

const dest = path.join(__dirname, '..', 'docs', 'api');
const distDest = path.join(dest, 'dist');
const exampleDest = path.join(dest, 'test-example');

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

  // make sure that the example dest is available
  sh.mkdir('-p', exampleDest);

  // copy the `dist` dir
  sh.cp('-R', 'dist', path.join(dest, 'dist'));
  sh.rm(path.join(dest, 'dist', `video-js-${pkg.version}.zip`));

  const filepaths = sh.find(path.join(__dirname, '..', 'sandbox', '**', '*.*'))
    .filter((filepath) => path.extname(filepath) === '.example');

  // copy the sandbox example files
  filepaths.forEach(function(filepath) {
    const p = path.parse(filepath);

    sh.cp(filepath, path.join(exampleDest, p.name));
  });
};

module.exports = {
  cleanupExample,
  generateExample
};
