module.exports = function(grunt) {

  grunt.registerTask('docs', 'Generate docs', function(){
    var markdox = require('markdox');
    var done = this.async();

    var options = {
      output: 'docs/api/player.md',
      formatter: require('../lib/formatter.js').format,
      template: 'docs/lib/template.ejs'
    };

    markdox.process('src/js/player.js', options, function(){
      console.log('File `all.md` generated with success');
      done();
    });
  });

};
