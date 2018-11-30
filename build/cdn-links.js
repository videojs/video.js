#!/usr/bin/env node

const fs = require('fs');
const doc = fs.readFileSync('docs/guides/setup.md');
const pkg = require('../../package.json');

// remove the patch version to point to the latest patch
const version = pkg.version.replace(/(\d+\.\d+)\.\d+/, '$1');

// update the version in http://vjs.zencdn.net/4.3/video.js
fs.writeFileSync(
  'docs/guides/setup.md',
  doc.replace(/(\/\/vjs\.zencdn\.net\/)\d+\.\d+(\.\d+)?/g, '$1' + version)
);
