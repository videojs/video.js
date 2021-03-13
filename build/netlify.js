const pkg = require('../package.json');
const path = require('path');
const sh = require('shelljs');

process.env.CI = true;
// run build steps
sh.exec('npm run build');
sh.exec('npm run sandbox');
sh.exec('npm run docs:api');

// copy the legacy docs over
sh.cp('-R', 'docs/legacy-docs', 'docs/api/docs');

const deployDir = 'deploy';
const files = [
  'node_modules/es5-shim/es5-shim.js',
  'node_modules/es6-shim/es6-shim.js'
];

// cleanup previous deploy
sh.rm('-rf', deployDir);
// make sure the directory exists
sh.mkdir('-p', deployDir);

// create nested directories
files
  .map((file) => path.dirname(file))
  .forEach((dir) => sh.mkdir('-p', path.join(deployDir, dir)));

// copy files/folders to deploy dir
files
  .concat('dist', 'index.html', 'sandbox', 'docs')
  .forEach((file) => sh.cp('-r', file, path.join(deployDir, file)));

sh.rm(path.join(deployDir, 'dist', `video-js-${pkg.version}.zip`));
