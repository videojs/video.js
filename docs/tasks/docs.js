module.exports = function(grunt) {
  var dox = require('dox')
    , fs = require('fs')
    , async = require('async')
    , formatter = require('../lib/formatter.js')
    , fs = require('fs')
    , util = require('util')
    , ejs = require('ejs')
    , path = require('path')
    , esprima = require('esprima')
    , esdoc = require('../../../esdoc');

  grunt.registerTask('docs', 'Generate docs', function(){
    // var file = fs.readFileSync('src/js/player.js', 'utf-8');
    // console.log(esprima.parse(file, {
    //   comment: true,
    //   loc: true,
    //   raw: true
    // }).comments);

    var done = this.async();
    var options = {
      output: 'docs/api/player.md',
      template: 'docs/lib/template.ejs'
    };

    exports.process('src/js/player.js', options, function(){
      console.log('File `all.md` generated with success');
      done();
    });
  });

  exports.process = function (files, options, callback) {
    callback =  callback || function() {};
    options = options || {};

    if (!util.isArray(files)) {
      files = [files];
    }

    var docSet = {
      docs: []
    };
    var doc, comments;

    async.forEach(files, function(file, callback){
      doc = {
        srcfile: file,
      };

      fs.readFile(file, 'utf-8', function(err, data){
        var espout = esprima.parse(data, {
          comment: true,
          loc: true,
          raw: true
        }).comments;
        // console.log('espout.comments', espout.comments);

        var comments = [];
        var asdf = espout[0].value;
        asdf = asdf.replace(/^\*/, '');
        asdf = asdf.replace(/^[ \t]*\* ?/gm, '');
        // console.log(JSON.stringify(dox.parseComment(asdf, { raw: true }), null, 4));
        // console.log(dox.parseCodeContext(data.split('\n')[espout[0].loc.end.line]));

        var codeLines = data.split('\n');

        espout.forEach(function(esComment, i){
          if (i > 1) return;
          if (esComment.type = 'Block') {
            var value = esComment.value;
            value = value.replace(/^\*/, '');
            value = value.replace(/^[ \t]*\* ?/gm, '');
            var doxComment = dox.parseComment(value, { raw: true });
            // get the line of code immediately after the comment
            doxComment.code = codeLines[esComment.loc.end.line].trim();
            doxComment.ctx = dox.parseCodeContext(doxComment.code);
            comments.push(doxComment);
          }
        });

        var doc = formatter(comments);

        console.log(JSON.stringify(doc, null, 4));

        doc.srcfile = file;
        docSet.docs.push(doc);
        callback(err);
      });

    }, function (err) {

      // exports.generate(docSet.docs, options, function(err, output){
      //   if (err) {
      //     throw err;
      //   }

      //   if (typeof options.output === 'string') {
      //     fs.writeFile(options.output, output, 'utf-8', function(err){
      //       if (err) {
      //         throw err;
      //       }

      //       callback(null, output);
      //     });
      //   } else {
      //     callback(null, output);
      //   }

      // });
    });
  };

  exports.generate = function(docfiles, options, callback) {
    callback =  callback || function() {};
    options = options || {};

    options.template = options.template || __dirname + '/../templates/template.md.ejs';

    ejs.open = '<?';
    ejs.close = '?>';

    fs.readFile(options.template, 'utf-8', function(err, data){
      if (err) {
        throw err;
      }

      // Remove indentation
      data = data.replace(/\n */g, '\n');

      var output = ejs.render(data, {
        docfiles: docfiles,
        escape: function(html) {
          return String(html);
        }
      });

      // Remove double lines
      output = output.replace(/\n{3,}/g, '\n\n');

      callback(null, output);
    });

  };

};
