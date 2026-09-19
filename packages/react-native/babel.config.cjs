const bobPreset = require('react-native-builder-bob/babel-preset');

// bob's preset passes `browserslist.findConfig()` straight into @babel/preset-env's `targets`, falling back to its own
// literal only when the lookup finds nothing. The repo root declares a `browserslist` field for the web builds, so the
// lookup now succeeds and returns `{ defaults: [...] }` — a shape preset-env rejects ("'defaults' is not a valid
// target"). Pin bob's fallback targets so this package builds against the same runtimes it did before the root field
// existed, and stays independent of web browser targets that mean nothing to Hermes.
const targets = {
  browsers: [
    '> 1%',
    'chrome 109',
    'edge 124',
    'firefox 127',
    'safari 17.4',
    'not dead',
    'not ie <= 11',
    'not op_mini all',
    'not android <= 4.4',
    'not samsung <= 4',
  ],
  node: '18',
};

function bobPresetWithPinnedTargets(api, options, cwd) {
  const config = bobPreset(api, options, cwd);

  return {
    ...config,
    presets: config.presets.map((preset) =>
      Array.isArray(preset) && preset[0].includes('preset-env') ? [preset[0], { ...preset[1], targets }] : preset
    ),
  };
}

module.exports = {
  overrides: [
    {
      exclude: /\/node_modules\//,
      presets: [bobPresetWithPinnedTargets],
    },
    {
      include: /\/node_modules\//,
      presets: ['module:@react-native/babel-preset'],
    },
  ],
};
