module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: [
          'src/js/goog.base.js',
          'src/js/core.js',
          'src/js/lib.js',
          'src/js/events.js',
          'src/js/component.js',
          'src/js/player.js',
          'src/js/media.js',
          'src/js/media.html5.js',
          'src/js/media.flash.js',
          'src/js/controls.js',
          'src/js/tracks.js',
          'src/js/setup.js',
          'src/js/json.js',
          'src/js/exports.js'
        ],
        dest: 'dist/video.js'
      },
      test: {
        src: [
          'test/unit/phantom-logging.js',
          'test/unit/component.js',
          'test/unit/core.js',
          'test/unit/events.js',
          'test/unit/lib.js',
          'test/unit/media.html5.js',
          'test/unit/player.js',
          'test/unit/setup.js',
        ],
        dest: 'test/unit.js'
      }
    },
    // Current forEach issue: https://github.com/gruntjs/grunt/issues/610
    // npm install https://github.com/gruntjs/grunt-contrib-jshint/archive/7fd70e86c5a8d489095fa81589d95dccb8eb3a46.tar.gz
    jshint: {
      dist: {
        src: ["dist/video.js"],
        options: {
          jshintrc: ".jshintrc"
        }
      }
    },
    qunit: {
      all: ['test/unit.html']
    },
    watch: {
      files: [ "src/**/*.js" ],
      tasks: "dev"
    }

  });

  // Default task.
  // grunt.registerTask('default', 'lint:beforeconcat concat lint:afterconcat');
  // // Default task(s).
  // grunt.registerTask('default', ['uglify']);

  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-qunit");
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask( "dev", [ "compile" ] ); // "build:*:*", "jshint"
  // compiled += grunt.file.read( filepath );

  var exec = require('child_process').exec,
      fs = require('fs'),
      gzip = require('zlib').gzip;

  grunt.registerMultiTask('build', 'Building Source', function(){
    grunt.log.writeln(this.target)
    if (this.target === 'latest') {
      var files = this.data.files;
      var dist = '';

      // for (prop in this.file) {
      //   grunt.log.writeln(prop + ":" + this.file[prop])
      // }

      files.forEach(function(file){
        dist += grunt.file.read('src/js/' + file)
      });

      grunt.file.write('dist/video.js', dist);
    } else if (this.target === 'test') {
      grunt.task.run('build:latest');
    }

  });

  grunt.registerTask('compile', 'Minify JS files using Closure Compiler.', function() {
    var done = this.async();

    var command = 'java -jar build/compiler/compiler.jar';
    command += ' --compilation_level ADVANCED_OPTIMIZATIONS';

    var files = [
      'goog.base.js',
      'core.js',
      'lib.js',
      'events.js',
      'component.js',
      'player.js',
      'media.js',
      'media.html5.js',
      'media.flash.js',
      'controls.js',
      'tracks.js',
      'setup.js',
      'json.js',
      'exports.js'
    ];

    files.forEach(function(file){
      command += ' --js=src/js/'+file;
    });

    command += ' --externs src/js/media.flash.externs.js';
    // command += ' --formatting=pretty_print';
    command += ' --js_output_file=test/video.compiled.js';
    command += ' --create_source_map test/video.compiled.js.map --source_map_format=V3';
    // command += ' --externs test/qunit-externs.js';
    command += ' --output_wrapper "(function() {%output%})();//@ sourceMappingURL=video.compiled.js.map"';

    exec(command, { maxBuffer: 500*1024 }, function(err, stdout, stderr){

      if (err) {
        grunt.warn(err);
        done(false);
      }

      if (stdout) {
        grunt.log.writeln(stdout);
      }

      grunt.log.writeln("done!")
      done();
    });
  });

};
