/*
Replaces the version number in the readme with the current package version.
Looks for patterns like `/8.17.3/` and `/video.js@8.17.3/`
*/

const fs = require('fs');
const path = require('path');
const version = require('../package.json').version;

let doc = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');

doc = doc
  .replace(/\/video.js@\d\.\d+\.\d+\//g, `/video.js@${version}/`)
  .replace(/\/\d\.\d+\.\d+\//g, `/${version}/`);

fs.writeFileSync(path.join(__dirname, '..', 'README.md'), doc, 'utf8');
