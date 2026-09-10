const fs = require('node:fs');
const path = require('node:path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');
const { parse } = require('yaml');

// Monorepo root, so Metro watches packages/react-native/src and resolves
// workspace symlinks out of the root node_modules store.
const root = path.resolve(__dirname, '../..');

// react-native-monorepo-config defaults to package.json's `workspaces` field,
// which pnpm doesn't use — feed it pnpm-workspace.yaml's globs instead.
const { packages: workspaces } = parse(fs.readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8'));

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
module.exports = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname,
  workspaces,
  // Resolves @videojs/react-native to its TypeScript source rather than the
  // built lib/, so edits in packages/react-native show up on Fast Refresh.
  conditions: ['react-native-source'],
});
