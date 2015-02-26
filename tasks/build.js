module.exports = function(grunt) {
  grunt.registerMultiTask('build', 'Building Source', function(){

    // Fix windows file path delimiter issue
    var i = grunt.sourceFiles.length;
    while (i--) {
      grunt.sourceFiles[i] = grunt.sourceFiles[i].replace(/\\/g, '/');
    }

    // Create a combined sources file. https://github.com/zencoder/video-js/issues/287
    var combined = '';
    grunt.sourceFiles.forEach(function(result){
      combined += grunt.file.read(result);
    });
    // Replace CDN version ref in js. Use major/minor version.
    combined = combined.replace(/GENERATED_CDN_VSN/g, grunt.vjsVersion.majorMinor);
    combined = combined.replace(/GENERATED_FULL_VSN/g, grunt.vjsVersion.full);

    grunt.file.write('build/files/combined.video.js', combined);

    // Copy over other files
    // grunt.file.copy('src/css/video-js.png', 'build/files/video-js.png');
    grunt.file.copy('node_modules/videojs-swf/dist/video-js.swf', 'build/files/video-js.swf');

    // Inject version number into css file
    var css = grunt.file.read('build/files/video-js.css');
    css = css.replace(/GENERATED_AT_BUILD/g, grunt.vjsVersion.full);
    grunt.file.write('build/files/video-js.css', css);

    // Copy over font files
    grunt.file.recurse('src/css/font', function(absdir, rootdir, subdir, filename) {
      // Block .DS_Store files
      if ('filename'.substring(0,1) !== '.') {
        grunt.file.copy(absdir, 'build/files/font/' + filename);
      }
    });

    // Minify CSS
    grunt.task.run(['cssmin']);
  });
}
