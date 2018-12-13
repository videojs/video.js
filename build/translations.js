const fs = require('fs');
const path = require('path');
const klawSync = require('klaw-sync');

const source = require('../lang/en.json');
const table = require('markdown-table');
const tableRegex = /(<!-- START langtable -->)(.|\n)*(<!-- END langtable -->)/;

let doc = fs.readFileSync('docs/translations-needed.md', 'utf8');
let tableData = [['Language file', 'Missing translations']];

const files = klawSync('lang');

files.forEach((file) => {
  const filename = path.basename(file.path);

  if (filename === 'en.json') {
    return;
  }

  const target = require(file.path);
  let missing = [];
  for (const string in source) {
    if (!target[string]) {
      console.log(`${filename} missing "${string}"`);
      missing.push(string);
    }
  }
  if (missing.length > 0) {
    console.error(`${filename} is missing ${missing.length} translations.`);
    tableData.push([`${filename} (missing ${missing.length})`, missing[0]]);
    for (var i = 1; i < missing.length; i++) {
      tableData.push(['', missing[i]]);
    }
  } else {
    console.log(`${filename} is up to date.`);
    tableData.push([`${filename} (Complete)`, '']);
  }
});

doc = doc.replace(tableRegex, `$1\n` + table(tableData) + `\n$3`);
fs.writeFileSync('docs/translations-needed.md', doc, 'utf8');
