var replace = require("replace");
var path = require('path')
var apiPath = path.join(__dirname, '..', 'docs', 'api');

var replacements = [
  {find: '\"/docs/guides/\"', replace: '"#"'},
  {find: '\"/docs/guides/(.*)\.md\"', replace: '"tutorial-$1.html"'},
  {find: '\"tutorial-tech.html\"', replace: '"tutorial-tech_.html"'}
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
