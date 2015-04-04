module.exports = function(grunt) {
  grunt.registerTask('vjs-version', function() {
    var version = grunt.vjsVersion.full;
    grunt.log.writeln(version);
    return version;
  });
}
