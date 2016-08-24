module.exports = function(grunt) {
  grunt.registerTask('check-translations', 'Check that translations are up to date', function(){
    const source = require('../../lang/en.json');
    let doc = grunt.file.read('docs/translations-needed.md');
    let table = '|---|---|\n';

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
        table += `|${filename}|${missing.join('|\n| |')}|\n`;
        table += `| | (${missing.length}) |\n`;
      } else {
        grunt.log.ok(`${filename} is up to date.`);
        table += `|${filename}|(Complete)|\n`;
      }
    });
    doc = doc.replace(/\|---\|---\|\n(.*\n)+/, table);
    grunt.file.write('docs/translations-needed.md', doc);
  });
};
