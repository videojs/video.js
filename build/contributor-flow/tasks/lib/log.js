var log = {};
var grunt = require('grunt');

log.log = function(str, options) {
  options = options || {};

  if (options.arrow !== false) {
    str = '-----> '+str;
  }

  grunt.log.writeln(str);
};

module.exports = log;
