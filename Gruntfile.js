require('babel-register');

// Need to `require` a separate Grunt file so we can use ES6 syntax via
// Babel's require hook.
module.exports = function(grunt) {
  require('./build/grunt.js')(grunt);
};
