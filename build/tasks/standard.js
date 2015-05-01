module.exports = function(grunt) {
  grunt.registerTask('standard', 'Run videojs-standard', function() {
    var done = this.async();
    grunt.util.spawn({
      cmd: 'videojs-standard',
      opts: {
        stdio: 'inherit'
      }
    }, done);
  });
};
