module.exports = function(grunt) {
  grunt.registerTask('addStyleInjection', 'Adding base style injection', function() {
    let minifiedCss = grunt.file.read('build/files/video-js.min.css');
    // We need to escape any strings
    minifiedCss = minifiedCss.replace(/'/g, '\\\'');

    let combinedJs = grunt.file.read('build/files/combined.video.js');
    combinedJs = combinedJs.replace(/\{{GENERATED_STYLES}}/g, minifiedCss);
    grunt.file.write('build/files/combined.video.js', combinedJs);
  });
};
