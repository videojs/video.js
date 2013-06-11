module.exports = function(grunt) {
  var pkg, s3, semver, version, verParts, uglify;

  semver = require('semver');
  pkg = grunt.file.readJSON('package.json');
  uglify = require('uglify-js');

  try {
    s3 = grunt.file.readJSON('.s3config.json');
  } catch(e) {
    s3 = {};
  }

  verParts = pkg.version.split('.');
  version = {
    full: pkg.version,
    major: verParts[0],
    minor: verParts[1],
    patch: verParts[2]
  };
  version.majorMinor = version.major + '.' + version.minor;

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,

    build: {
      src: 'src/js/dependencies.js',
      options: {
        baseDir: 'src/js/'
      }
    },
    clean: {
      build: ['build/files/*'],
      dist: ['dist/*']
    },
    jshint: {
      src: {
        src: ['src/js/*.js', 'Gruntfile.js', 'test/unit/*.js'],
        options: {
          jshintrc: '.jshintrc'
        }
      }
    },
    minify: {
      source:{
        src: ['build/files/combined.video.js', 'build/compiler/goog.base.js', 'src/js/exports.js'],
        externs: ['src/js/media/flash.externs.js'],
        dest: 'build/files/minified.video.js'
      },
      tests: {
        src: ['build/files/combined.video.js', 'build/compiler/goog.base.js', 'src/js/exports.js', 'test/unit/*.js', '!test/unit/api.js'],
        externs: ['src/js/media/flash.externs.js', 'test/qunit/qunit-externs.js'],
        dest: 'build/files/test.minified.video.js'
      }
    },
    dist: {},
    qunit: {
      source: ['test/index.html'],
      minified: ['test/minified.html'],
      minified_api: ['test/minified-api.html']
    },
    watch: {
      files: [ 'src/**/*.js', 'test/unit/*.js' ],
      tasks: 'dev'
    },
    copy: {
      minor: {
        files: [
          {expand: true, cwd: 'build/files/', src: ['*'], dest: 'dist/'+version.majorMinor+'/', filter: 'isFile'} // includes files in path
        ]
      },
      patch: {
        files: [
          {expand: true, cwd: 'build/files/', src: ['*'], dest: 'dist/'+version.full+'/', filter: 'isFile'} // includes files in path
        ]
      }
    },
    s3: {
      options: s3,
      minor: {
        upload: [
          {
            src: 'dist/cdn/*',
            dest: 'vjs/'+version.majorMinor+'/',
            rel: 'dist/cdn/',
            headers: {
              'Cache-Control': 'public, max-age=2628000'
            }
          }
        ]
      },
      patch: {
        upload: [
          {
            src: 'dist/cdn/*',
            dest: 'vjs/'+version.full+'/',
            rel: 'dist/cdn/',
            headers: {
              'Cache-Control': 'public, max-age=31536000'
            }
          }
        ]
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'build/files/',
        src: ['video-js.css'],
        dest: 'build/files/',
        ext: '.min.css'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-s3');
  grunt.loadNpmTasks('contribflow');

  // Default task.
  grunt.registerTask('default', ['jshint', 'build', 'minify', 'dist']);
  // Development watch task
  grunt.registerTask('dev', ['jshint', 'build', 'qunit:source']);
  grunt.registerTask('test', ['jshint', 'build', 'minify', 'qunit']);

  var fs = require('fs'),
      gzip = require('zlib').gzip;

  grunt.registerMultiTask('build', 'Building Source', function(){
    /*jshint undef:false, evil:true */

    // Loading predefined source order from source-loader.js
    // Trust me, this is the easist way to do it so far.
    var blockSourceLoading = true;
    var sourceFiles; // Needed to satisfy jshint
    eval(grunt.file.read('./build/source-loader.js'));

    // Fix windows file path delimiter issue
    var i = sourceFiles.length;
    while (i--) {
      sourceFiles[i] = sourceFiles[i].replace(/\\/g, '/');
    }

    // Create a combined sources file. https://github.com/zencoder/video-js/issues/287
    var combined = '';
    sourceFiles.forEach(function(result){
      combined += grunt.file.read(result);
    });
    // Replace CDN version ref in js. Use major/minor version.
    combined = combined.replace(/GENERATED_CDN_VSN/g, version.majorMinor);
    grunt.file.write('build/files/combined.video.js', combined);

    // Copy over other files
    grunt.file.copy('src/css/video-js.css', 'build/files/video-js.css');
    grunt.file.copy('src/css/video-js.png', 'build/files/video-js.png');
    grunt.file.copy('src/swf/video-js.swf', 'build/files/video-js.swf');

    // Inject version number into css file
    var css = grunt.file.read('build/files/video-js.css');
    css = css.replace(/GENERATED_AT_BUILD/g, version.full);
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

  grunt.registerMultiTask('minify', 'Minify JS files using Closure Compiler.', function() {
    var done = this.async();
    var exec = require('child_process').exec;

    var externs = this.data.externs || [];
    var dest = this.data.dest;
    var filePatterns = [];

    // Make sure deeper directories exist for compiler
    grunt.file.write(dest, '');

    if (this.data.sourcelist) {
      filePatterns = filePatterns.concat(grunt.file.read(this.data.sourcelist).split(','));
    }
    if (this.data.src) {
      filePatterns = filePatterns.concat(this.data.src);
    }

    // Build closure compiler shell command
    var command = 'java -jar build/compiler/compiler.jar'
                + ' --compilation_level ADVANCED_OPTIMIZATIONS'
                // + ' --formatting=pretty_print'
                + ' --js_output_file=' + dest
                + ' --create_source_map ' + dest + '.map --source_map_format=V3'
                + ' --jscomp_warning=checkTypes --warning_level=VERBOSE'
                + ' --output_wrapper "/*! Video.js v' + version.full + ' ' + pkg.copyright + ' */\n (function() {%output%})();//@ sourceMappingURL=video.js.map"';

    // Add each js file
    grunt.file.expand(filePatterns).forEach(function(file){
      command += ' --js='+file;
    });

    // Add externs
    externs.forEach(function(extern){
      command += ' --externs='+extern;
    });

    // Run command
    exec(command, { maxBuffer: 500*1024 }, function(err, stdout, stderr){

      if (err) {
        grunt.warn(err);
        done(false);
      }

      if (stdout) {
        grunt.log.writeln(stdout);
      }

      done();
    });
  });

  grunt.registerTask('dist', 'Creating distribution', function(){
    var exec = require('child_process').exec;
    var done = this.async();
    var css, jsmin, jsdev, cdnjs;

    // Manually copy each source file
    grunt.file.copy('build/files/minified.video.js', 'dist/video-js/video.js');
    grunt.file.copy('build/files/combined.video.js', 'dist/video-js/video.dev.js');
    grunt.file.copy('build/files/video-js.css', 'dist/video-js/video-js.css');
    grunt.file.copy('build/files/video-js.min.css', 'dist/video-js/video-js.min.css');
    grunt.file.copy('build/files/video-js.swf', 'dist/video-js/video-js.swf');
    grunt.file.copy('build/demo-files/demo.html', 'dist/video-js/demo.html');
    grunt.file.copy('build/demo-files/demo.captions.vtt', 'dist/video-js/demo.captions.vtt');

    // Copy over font files
    grunt.file.recurse('build/files/font', function(absdir, rootdir, subdir, filename) {
      // Block .DS_Store files
      if ('filename'.substring(0,1) !== '.') {
        grunt.file.copy(absdir, 'dist/video-js/font/' + filename);
      }
    });

    // CDN version uses already hosted font files
    // Minified version only, doesn't need demo files
    grunt.file.copy('build/files/minified.video.js', 'dist/cdn/video.js');
    grunt.file.copy('build/files/video-js.min.css', 'dist/cdn/video-js.css');
    grunt.file.copy('build/files/video-js.swf', 'dist/cdn/video-js.swf');

    // Replace font urls with CDN versions
    css = grunt.file.read('dist/cdn/video-js.css');
    css = css.replace(/font\//g, '../f/1/');
    grunt.file.write('dist/cdn/video-js.css', css);

    // Add CDN-specfic JS
    jsmin = grunt.file.read('dist/cdn/video.js');
    // GA Tracking Pixel (manually building the pixel URL)
    cdnjs = uglify.minify('src/js/cdn.js').code.replace('v0.0.0', 'v'+version.full);
    grunt.file.write('dist/cdn/video.js', jsmin + cdnjs);

    // Zip up into video-js-VERSION.zip
    exec('cd dist && zip -r video-js-'+version.full+'.zip video-js && cd ..', { maxBuffer: 500*1024 }, function(err, stdout, stderr){

      if (err) {
        grunt.warn(err);
        done(false);
      }

      if (stdout) {
        grunt.log.writeln(stdout);
      }

      done();
    });
  });
};
