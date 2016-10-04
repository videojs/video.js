module.exports = function(grunt) {
  grunt.registerTask('check-translations', 'Check that translations are up to date', function(){
    const source = require('../../lang/en.json');
    const table = require('markdown-table');
    let doc = grunt.file.read('docs/translations-needed.md');
    const tableRegex = /(<!-- START langtable -->)(.|\n)*(<!-- END langtable -->)/;
    let tableData = [['Language file', 'Missing translations']];

    grunt.file.recurse('lang', (abspath, rootdir, subdir, filename) => {
      if (filename === 'en.json') {
        return;
      }
      const target = require(`../../${abspath}`);
      let missing = [];
      for (const string in source) {
        if (!target[string]) {
          grunt.log.writeln(`${filename} missing "${string}"`);
          missing.push(string);
        }
      }
      if (missing.length > 0) {
        grunt.log.error(`${filename} is missing ${missing.length} translations.`);
        tableData.push([`${filename} (missing ${missing.length})`, missing[0]]);
        for (var i = 1; i < missing.length; i++) {
          tableData.push(['', missing[i]]);
        }
      } else {
        grunt.log.ok(`${filename} is up to date.`);
        tableData.push([`${filename} (Complete)`, '']);
      }
    });
    doc = doc.replace(tableRegex, `$1\n` + table(tableData) + `\n$3`);
    grunt.file.write('docs/translations-needed.md', doc);
  });
};
