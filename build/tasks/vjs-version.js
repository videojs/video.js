module.exports = function(grunt) {
  grunt.registerTask('vjs-version', function() {
    let version = grunt.vjsVersion.full;
    grunt.log.writeln(version);
    return version;
  });
}
