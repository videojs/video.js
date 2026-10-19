const videojsBobPreset = require('./babel-preset.cjs');

module.exports = {
  overrides: [
    {
      exclude: /\/node_modules\//,
      presets: [videojsBobPreset],
    },
    {
      include: /\/node_modules\//,
      presets: ['module:@react-native/babel-preset'],
    },
  ],
};
