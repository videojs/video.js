/**
 * Replaces the @react-native/gradle-plugin pnpm symlink with a real directory.
 *
 * Android Studio can't sync this project while the package is a symlink (default pnpm behavior).
 *
 * This is intended to be a lighter alternative to `node-linker=hoisted`, which would affect the whole workspace
 *
 * NOTE: This is required for Android Studio IDE builds, not for react-native or gradle CLI builds. those work fine, but
 * editing native code without the IDE is not a great experience, so we support it with this workaround
 */

import { cpSync, lstatSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', '@react-native', 'gradle-plugin');

let stats;

try {
  stats = lstatSync(pkg);
} catch {
  console.log('[gradle-plugin] not installed, skipping');
  process.exit(0);
}

if (!stats.isSymbolicLink()) {
  console.log('[gradle-plugin] already a real directory, skipping');
  process.exit(0);
}

const target = realpathSync(pkg);

rmSync(pkg);
cpSync(target, pkg, { recursive: true });
console.log(`[gradle-plugin] materialized from ${target}`);
