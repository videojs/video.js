var shell = {};

var log = require('./log.js');
var exec = require('child_process').exec;
var grunt = require('grunt');

shell.run = function(command, options, callback) {
  options = options || {};

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  callback = callback || function(){};

  if (options.logging !== false) {
    log('$ ' + command, { arrow: false });
  }

  exec(command, function(err, stdout, stderr){
    if (err) {
      log(stderr);
      callback(err);
    }

    log(stdout);
    return callback(null, stdout);
  });
};

module.exports = shell;
