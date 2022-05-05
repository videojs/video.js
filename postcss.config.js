// see https://github.com/browserslist/browserslist for more info
const browsersList = ['last 3 major version', 'Firefox ESR', 'Chrome >= 53', 'not dead', 'not ie 11'];

module.exports = {
  plugins: [
    require('autoprefixer')(browsersList)
  ]
};
