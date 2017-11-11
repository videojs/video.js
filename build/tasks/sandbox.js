const fs = require('fs');
const path = require('path');
const klawSync = require('klaw-sync');

module.exports = function(grunt) {
  grunt.registerTask('sandbox', 'copy over sandbox example files if necessary', function() {
    const files = klawSync('sandbox/').filter((file) => path.extname(file.path) === '.example');

    const changes = files.map(function(file) {
      const p = path.parse(file.path);
      const nonExample = path.join(p.dir, p.name);
      return {
        file: file.path,
        copy: nonExample
      };
    })
    .filter(function(change) {
      return !fs.existsSync(change.copy);
    });

    changes.forEach(function(change) {
      grunt.file.copy(change.file, change.copy);
    });

    if (changes.length) {
      grunt.log.writeln("Updated Sandbox files for:");
      grunt.log.writeln('\t' + changes.map((chg) => chg.copy).join('\n\t'));
    } else {
      grunt.log.writeln("No sandbox updates necessary");
    }

  });
};
