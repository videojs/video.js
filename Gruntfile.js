module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    build: {
      dist:{}
    },
    // Current forEach issue: https://github.com/gruntjs/grunt/issues/610
    // npm install https://github.com/gruntjs/grunt-contrib-jshint/archive/7fd70e86c5a8d489095fa81589d95dccb8eb3a46.tar.gz
    jshint: {
      src: {
        src: ["src/js/*.js"],
        options: {
          jshintrc: ".jshintrc"
        }
      }
    },
    compile: {
      dist:{
        sourcelist: 'dist/sourcelist.txt',
        externs: ['src/js/media.flash.externs.js'],
        dest: 'dist/video.js'
      },
      test: {
        sourcelist: 'dist/sourcelist.txt',
        src: ['test/unit/*.js'],
        externs: ['src/js/media.flash.externs.js', 'test/qunit/qunit-externs.js'],
        dest: 'test/video.test.js'
      }
    },
    dist: {
      latest:{}
    },
    qunit: {
      all: ['test/index.html', 'test/compiled.html'],
    },
    watch: {
      files: [ "src/**/*.js" ],
      tasks: "dev"
    }

  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-qunit");
  grunt.loadNpmTasks("grunt-contrib-watch");

  // Default task.
  grunt.registerTask('default', ['build', 'jshint', 'compile', 'dist']);
  // Development watch task
  grunt.registerTask('dev', ['jshint','build']);
  grunt.registerTask('test', ['jshint','compile','qunit']);


  var fs = require('fs'),
      gzip = require('zlib').gzip;

  grunt.registerMultiTask('build', 'Building Source', function(){
    var calcdeps = require('calcdeps').calcdeps;
    // caclcdeps is async
    var done = this.async();

    // In current version of calcdeps, not supplying certain
    // options that should have defaults causes errors
    // so we have all options listed here with their defaults.
    calcdeps({
      input: ['src/js/exports.js'],
      path:['src/js/'],
      dep:[],
      exclude:[],
      output_mode:'list',
    }, function(err,results){
      if (err) {
        grunt.warn({ message: err })
        grunt.log.writeln(err);
        done(false);
      }

      if (results) {
        grunt.file.write('dist/sourcelist.txt', results.join(','));
        grunt.file.write('dist/sourcelist.js', 'var sourcelist = ["' + results.join('","') + '"]');
      }

      done();
    });
  });

  grunt.registerMultiTask('compile', 'Minify JS files using Closure Compiler.', function() {
    var done = this.async();
    var exec = require('child_process').exec;

    var externs = this.file.externs || [];
    var dest = this.file.dest;
    var files = [];
    if (this.data.sourcelist) {
      files = files.concat(grunt.file.read(this.data.sourcelist).split(','))
    }
    if (this.file.src) {
      files = files.concat(this.file.src);
    }

    var command = 'java -jar build/compiler/compiler.jar'
                + ' --compilation_level ADVANCED_OPTIMIZATIONS'
                // + ' --formatting=pretty_print'
                + ' --js_output_file=' + dest
                + ' --create_source_map ' + dest + '.map --source_map_format=V3'
                + ' --output_wrapper "(function() {%output%})();//@ sourceMappingURL=video.js.map"';

    files.forEach(function(file){
      command += ' --js='+file;
    });

    externs.forEach(function(extern){
      command += ' --externs='+extern;
    });

    // grunt.log.writeln(command)

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

  grunt.registerMultiTask('dist', 'Creating distribution', function(){

  });
};
