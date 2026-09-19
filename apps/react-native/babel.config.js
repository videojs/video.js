const path = require('node:path');

const videojsBobPreset = require('../../packages/react-native/babel-preset.cjs');

const pkg = require('../../packages/react-native/package.json');

// Points the `react-native-source` condition at the library's src/ so Babel
// compiles it as part of the app's bundle.
const root = path.resolve(__dirname, '../../packages/react-native');
const source = path.join(root, pkg['react-native-builder-bob'].source);

// This is `react-native-builder-bob/babel-config`'s `getConfig()` inlined, so the library's source override can use the
// targets-pinned preset instead of bob's own — see packages/react-native/babel-preset.cjs for why bob's crashes here.
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  overrides: [
    {
      include: (filename) => filename != null && filename.startsWith(`${source}${path.sep}`),
      // The app's preset handles the commonjs transform; leaving it to bob's emits `export` in the wrong places.
      presets: [[videojsBobPreset, { supportsStaticESM: true }]],
    },
  ],
};
