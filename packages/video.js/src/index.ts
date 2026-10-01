/**
 * The `video.js` root entry: coded stubs for the Video.js 8 module surface, so `import videojs from 'video.js'` fails
 * with a `VJS8_LEGACY_*` code instead of "undefined is not a function".
 *
 * Video.js 10 players live in `@videojs/html` and `@videojs/react`. This package carries no player and no dependency on
 * either, so the stubs never pull a player into a v8 project that installed `video.js` by mistake.
 */
export {
  default,
  getComponent,
  getPlayer,
  getPlugin,
  type LegacyVideojs,
  options,
  registerComponent,
  registerPlugin,
} from './videojs';
