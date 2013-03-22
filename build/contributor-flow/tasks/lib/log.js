module.exports = function log(str, options) {
  options = options || {};

  if (options.arrow !== false) {
    str = '-----> ' + str;
  }

  console.log(str + '\n');
};
