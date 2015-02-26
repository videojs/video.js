module.exports = function(grunt) {
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
    + ' --output_wrapper "(function() {%output%})();"';
    //@ sourceMappingURL=video.js.map

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
}
