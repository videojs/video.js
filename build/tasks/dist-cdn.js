var uglify = require('uglify-js');

module.exports = function(grunt) {
  grunt.registerTask('dist-cdn', 'Assembling distribution', function(){
    var css, jsmin, jsdev, cdnjs;

    // Replace font urls with CDN versions
    css = grunt.file.read('dist/cdn/video-js.css');
    css = css.replace(/font\//g, '../f/3/');
    grunt.file.write('dist/cdn/video-js.css', css);

    // GA Tracking Pixel (manually building the pixel URL)
    cdnjs = '\n' + uglify.minify('build/cdn.js').code.replace('v0.0.0', 'v'+ grunt.vjsVersion.full);

    // Add CDN-specfic JS
    js = grunt.file.read('dist/cdn/video.js');
    grunt.file.write('dist/cdn/video.js', js + cdnjs);

    jsmin = grunt.file.read('dist/cdn/video.min.js');
    grunt.file.write('dist/cdn/video.min.js', jsmin + cdnjs);
  });
}
