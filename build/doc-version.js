// Updates the "vX.X.X source" link to github in .jsdoc.json
// that will be included in the menu of the API docs

const fs = require('fs');
const jsdocConfig = require('../.jsdoc.json');
const pkgJson = require('../package.json');

jsdocConfig.opts.theme_opts.menu.find(menuItem => {
  return menuItem.link === 'https://github.com/videojs/video.js';
}).title = `v${pkgJson.version} source`;

fs.writeFileSync('.jsdoc.json', JSON.stringify(jsdocConfig, null, 2));
