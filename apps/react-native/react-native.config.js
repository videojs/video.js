const path = require('node:path');

const pkg = require('../../packages/react-native/package.json');

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    // Autolink the workspace library from its source directory. The empty
    // platform objects are required — codegen fails to pick up the spec
    // without them.
    [pkg.name]: {
      root: path.resolve(__dirname, '../../packages/react-native'),
      platforms: {
        ios: {},
        android: {},
      },
    },
  },
};
