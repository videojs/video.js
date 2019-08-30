/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const sh = require('shelljs');

const files = sh.find(path.join(__dirname, '..', 'sandbox', '**', '*.*'))
  .filter((filepath) => path.extname(filepath) === '.example');

const changes = files.map(function(filepath) {
  const p = path.parse(filepath);
  const nonExample = path.join(p.dir, p.name);

  return {
    file: filepath,
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
