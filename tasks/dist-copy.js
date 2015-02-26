module.exports = function(grunt) {
  grunt.registerTask('dist-copy', 'Assembling distribution', function(){
    var css, jsmin, jsdev, cdnjs, uglify;

    uglify = require('uglify-js');

    // Manually copy each source file
    grunt.file.copy('build/files/minified.video.js', 'dist/video-js/video.js');
    grunt.file.copy('build/files/combined.video.js', 'dist/video-js/video.dev.js');
    grunt.file.copy('build/files/minified.video.novtt.js', 'dist/video-js/video.novtt.js');
    grunt.file.copy('build/files/combined.video.novtt.js', 'dist/video-js/video.novtt.dev.js');
    grunt.file.copy('build/files/video-js.css', 'dist/video-js/video-js.css');
    grunt.file.copy('build/files/video-js.min.css', 'dist/video-js/video-js.min.css');
    grunt.file.copy('node_modules/videojs-swf/dist/video-js.swf', 'dist/video-js/video-js.swf');
    grunt.file.copy('build/demo-files/demo.html', 'dist/video-js/demo.html');
    grunt.file.copy('build/demo-files/demo.captions.vtt', 'dist/video-js/demo.captions.vtt');
    grunt.file.copy('src/css/video-js.less', 'dist/video-js/video-js.less');


    // Copy over font files
    grunt.file.recurse('build/files/font', function(absdir, rootdir, subdir, filename) {
      // Block .DS_Store files
      if ('filename'.substring(0,1) !== '.') {
        grunt.file.copy(absdir, 'dist/video-js/font/' + filename);
      }
    });

    // Copy over language files
    grunt.file.recurse('build/files/lang', function(absdir, rootdir, subdir, filename) {
      // Block .DS_Store files
      if ('filename'.substring(0,1) !== '.') {
        grunt.file.copy(absdir, 'dist/cdn/lang/' + filename);
        grunt.file.copy(absdir, 'dist/video-js/lang/' + filename);
      }
    });

    // ds_store files sometime find their way in
    if (grunt.file.exists('dist/video-js/.DS_Store')) {
      grunt.file['delete']('dist/video-js/.DS_Store');
    }

    // CDN version uses already hosted font files
    // Minified version only, doesn't need demo files
    grunt.file.copy('build/files/minified.video.js', 'dist/cdn/video.js');
    grunt.file.copy('build/files/video-js.min.css', 'dist/cdn/video-js.css');
    grunt.file.copy('node_modules/videojs-swf/dist/video-js.swf', 'dist/cdn/video-js.swf');
    grunt.file.copy('build/demo-files/demo.captions.vtt', 'dist/cdn/demo.captions.vtt');
    grunt.file.copy('build/demo-files/demo.html', 'dist/cdn/demo.html');

    // Replace font urls with CDN versions
    css = grunt.file.read('dist/cdn/video-js.css');
    css = css.replace(/font\//g, '../f/3/');
    grunt.file.write('dist/cdn/video-js.css', css);

    // Add CDN-specfic JS
    jsmin = grunt.file.read('dist/cdn/video.js');
    // GA Tracking Pixel (manually building the pixel URL)
    cdnjs = uglify.minify('src/js/cdn.js').code.replace('v0.0.0', 'v'+ grunt.vjsVersion.full);
    grunt.file.write('dist/cdn/video.js', jsmin + cdnjs);
  });
}
