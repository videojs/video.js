module.exports = function(grunt) {
  grunt.registerTask('vttjs', 'prepend vttjs to videojs source files', function() {
    var vttjs, vttjsMin, vjs, vjsMin;

    // copy the current files to make a novttjs build
    grunt.file.copy('build/files/combined.video.js', 'build/files/combined.video.novtt.js');
    grunt.file.copy('build/files/minified.video.js', 'build/files/minified.video.novtt.js');

    // read in vttjs files
    vttjs = grunt.file.read('node_modules/vtt.js/dist/vtt.js');
    vttjsMin = grunt.file.read('node_modules/vtt.js/dist/vtt.min.js');
    // read in videojs files
    vjs = grunt.file.read('build/files/combined.video.js');
    vjsMin = grunt.file.read('build/files/minified.video.js');

    // write out the concatenated files
    grunt.file.write('build/files/combined.video.js', vjs + '\n' + vttjs);
    grunt.file.write('build/files/minified.video.js', vjsMin + '\n' + vttjsMin);
  });
};
