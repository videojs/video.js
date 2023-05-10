/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const sh = require('shelljs');

const files = sh.find(path.join(__dirname, '..', 'images', '**', '*.*'))
  .filter((filepath) => path.extname(filepath) === '.svg');

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
  console.log('Updated Image files for:');
  console.log('\t' + changes.map((chg) => chg.copy).join('\n\t'));
} else {
  console.log('No Image updates necessary');
}
