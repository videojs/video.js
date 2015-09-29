module.exports = function(grunt) {
  grunt.registerTask('saucelabs', function() {
    const exec = require('child_process').exec;
    const done = this.async();

    if (this.args[0] == 'connect') {
      exec('curl https://gist.githubusercontent.com/santiycr/5139565/raw/sauce_connect_setup.sh | bash',
      function(error, stdout, stderr) {
        if (error) {
          grunt.log.error(error);
          return done();
        }

        grunt.verbose.error(stderr.toString());
        grunt.verbose.writeln(stdout.toString());
        grunt.task.run(['karma:saucelabs']);
        done();
      });
    } else {
      grunt.task.run(['karma:saucelabs']);
      done();
    }
  });
}
