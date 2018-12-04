/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const sh = require('shelljs');

const source = require('../lang/en.json');
const table = require('markdown-table');
const tableRegex = /(<!-- START langtable -->)(.|\n)*(<!-- END langtable -->)/;

let doc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'translations-needed.md'), 'utf8');
const tableData = [['Language file', 'Missing translations']];

const filepaths = sh.find(path.join(__dirname, '..', 'lang', '**', '*.json'));

filepaths.forEach((filepath) => {
  const filename = path.basename(filepath);

  if (filename === 'en.json') {
    return;
  }

  const target = require(filepath);
  const missing = [];

  for (const string in source) {
    if (!target[string]) {
      console.log(`${filename} missing "${string}"`);
      missing.push(string);
    }
  }
  if (missing.length > 0) {
    console.error(`${filename} is missing ${missing.length} translations.`);
    tableData.push([`${filename} (missing ${missing.length})`, missing[0]]);
    for (let i = 1; i < missing.length; i++) {
      tableData.push(['', missing[i]]);
    }
  } else {
    console.log(`${filename} is up to date.`);
    tableData.push([`${filename} (Complete)`, '']);
  }
});

doc = doc.replace(tableRegex, '$1\n' + table(tableData) + '\n$3');
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'translations-needed.md'), doc, 'utf8');
