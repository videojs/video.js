/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const sh = require('shelljs');

const files = sh.find(path.join(__dirname, '..', 'sandbox', '**', '*.*'))
  .filter((filepath) => path.extname(filepath) === '.example');

const changes = files.map(function(file) {
  const p = path.parse(file.path);
  const nonExample = path.join(p.dir, p.name);

  return {
    file: file.path,
    copy: nonExample
  };
}).filter(function(change) {
  return !fs.existsSync(change.copy);
});

changes.forEach(function(change) {
  fs.copyFileSync(change.file, change.copy);
});

if (changes.length) {
  console.log('Updated Sandbox files for:');
  console.log('\t' + changes.map((chg) => chg.copy).join('\n\t'));
} else {
  console.log('No sandbox updates necessary');
}
