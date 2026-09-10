const path = require('node:path');
const { getConfig } = require('react-native-builder-bob/babel-config');

const pkg = require('../../packages/react-native/package.json');

// Points the `react-native-source` condition at the library's src/ so Babel
// compiles it as part of the app's bundle.
const root = path.resolve(__dirname, '../../packages/react-native');

module.exports = getConfig({ presets: ['module:@react-native/babel-preset'] }, { root, pkg });
