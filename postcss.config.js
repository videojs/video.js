// default is: > 0.5%, last 2 versions, Firefox ESR, not dead
// we add on ie 11 since we still support that.
// see https://github.com/browserslist/browserslist for more info
const browsersList = ['defaults', 'ie 11'];

module.exports = {
  plugins: [
    require('autoprefixer')(browsersList)
  ]
};
