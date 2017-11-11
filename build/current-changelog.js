var unified = require('unified');
var markdown = require('remark-parse');
var stringify = require('remark-stringify');
var fs = require('fs');

module.exports = function() {
  var processor = unified()
  .use(markdown, {commonmark: true})
  .use(stringify);

  var ast = processor.parse(fs.readFileSync('./CHANGELOG.md'));

  var changelog = [];
  changelog.push(processor.stringify(ast.children[0]));

  // start at 1 so we get the first anchor tag
  // and can break on the second
  for (var i = 1; i < ast.children.length; i++) {
    var item = processor.stringify(ast.children[i]);

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
