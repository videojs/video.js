var replace = require("replace");
var path = require('path')
var apiPath = path.join(__dirname, '..', 'docs', 'api');

var replacements = [
  {find: /\/docs\/guides\/(.+)\.md/g, replace: 'tutorial-$1.html'},
  {find: /tutorial-tech.html/g, replace: 'tutorial-tech_.html'},
  {find: /\/docs\/guides\//g, replace: '#'}
];


replacements.forEach(function(obj) {
  replace({
    regex: obj.find,
    replacement: obj.replace,
    paths: [apiPath],
    recursive: true,
    silent: true
  });
});
