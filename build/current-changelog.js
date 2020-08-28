/* eslint-disable no-console */

const unified = require('unified');
const markdown = require('remark-parse');
const stringify = require('remark-stringify');
const fs = require('fs');

module.exports = function() {
  const processor = unified()
    .use(markdown, {commonmark: true})
    .use(stringify);

  const ast = processor.parse(fs.readFileSync('./CHANGELOG.md'));
  const changelog = [];

  changelog.push(processor.stringify(ast.children[0]));

  // start at 1 so we get the first anchor tag
  // and can break on the second
  for (let i = 1; i < ast.children.length; i++) {
    let item = processor.stringify(ast.children[i]);

    if (/^<a name="/.test(item)) {
      break;
    }

    if (/^###/.test(item)) {
      item = '\n' + item + '\n';
    }

    changelog.push(item);
  }

  return changelog.join('\n');
};
