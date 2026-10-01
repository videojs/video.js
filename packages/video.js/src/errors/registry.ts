import { getLegacyErrorSlug, getLegacyErrorUrl, LEGACY_ERROR_CODES, type LegacyErrorCode } from './codes';

/**
 * What each `VJS8_LEGACY_*` code means and what to do instead.
 *
 * The registry is the single source for the message the stubs throw in dev builds and for the generated API reference
 * pages, so the two never drift. It lives only in the `video.js` package: the `@videojs/*` packages stay free of legacy
 * detection, and production builds of this package import only `./codes`.
 */
export interface LegacyErrorEntry {
  /** One sentence naming the v8 API and why it no longer exists. */
  summary: string;
  /** The v8 snippet that triggers this code, as it appears in the wild. */
  legacy: string;
  /** The v10 equivalent for `@videojs/html`, one line. */
  html: string;
  /** The v10 equivalent for `@videojs/react`, one line. */
  react: string;
}

/*
 * `summary`, `html`, and `react` are inline Markdown: code and markup go in backticks. The thrown message prints them
 * as-is, and the error pages render them, so a bare `<tag>` outside backticks would be swallowed as HTML there.
 */

/** A registry entry resolved for one code, with everything an error page or message needs. */
export interface LegacyErrorRecord extends LegacyErrorEntry {
  code: LegacyErrorCode;
  slug: string;
  url: string;
  /** The stay-on-v8 line every code carries. */
  stayOnV8: string;
}

export const LEGACY_V8_DOCS_URL = 'https://legacy.videojs.org';

export const LEGACY_V8_INSTALL = 'npm install video.js@8';

export const LEGACY_V8_LINE = `Staying on v8 is fine: \`${LEGACY_V8_INSTALL}\` — docs at ${LEGACY_V8_DOCS_URL}.`;

export const LEGACY_ERRORS = {
  VJS8_LEGACY_INIT: {
    summary: '`videojs()` was the Video.js 8 API. Video.js 10 has no factory; players are components you compose.',
    legacy: "const player = videojs('my-video', { controls: true });",
    html: "Install `@videojs/html`, `import '@videojs/html/video/player'` and `import '@videojs/html/video/skin'`, and render `<video-player><video-skin><video src></video></video-skin></video-player>`.",
    react:
      "`import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video'` and render `<VideoPlayer><VideoSkin><Video src /></VideoSkin></VideoPlayer>`.",
  },
  VJS8_LEGACY_PLUGIN: {
    summary: '`videojs.registerPlugin()` was the Video.js 8 plugin system. Video.js 10 has no plugin registry.',
    legacy: "videojs.registerPlugin('myPlugin', function () { /* ... */ });",
    html: 'Compose behavior as components inside `<video-player>`, or add an extension such as `@videojs/google-cast`.',
    react: 'Compose behavior as components inside `<VideoPlayer>`, or add an extension such as `@videojs/google-cast`.',
  },
  VJS8_LEGACY_COMPONENT: {
    summary:
      '`videojs.registerComponent()` was the Video.js 8 component tree. Video.js 10 components are custom elements and React components.',
    legacy: "videojs.registerComponent('MyButton', MyButton);",
    html: 'Define a custom element and place it inside `<video-skin>` or your own skin markup.',
    react: 'Write a React component and place it inside `<VideoSkin>` or your own skin tree.',
  },
  VJS8_LEGACY_GET_PLAYER: {
    summary:
      '`videojs.getPlayer()` looked players up by id. Video.js 10 has no registry; hold a reference to the element.',
    legacy: "const player = videojs.getPlayer('my-video');",
    html: "`document.querySelector('video-player')` and call actions on its `store.state`.",
    react: 'Select state and actions with `usePlayer()` from `@videojs/react/video` inside the tree.',
  },
  VJS8_LEGACY_OPTIONS: {
    summary:
      '`videojs.options` held Video.js 8 global defaults. Video.js 10 has no global; configuration lives on the components you render.',
    legacy: 'videojs.options.autoplay = true;',
    html: 'Set attributes on `<video-player>`, `<video-skin>`, and the media element.',
    react: 'Pass props to `<VideoPlayer>`, `<VideoSkin>`, and the media component.',
  },
} satisfies Record<LegacyErrorCode, LegacyErrorEntry>;

export function getLegacyErrorRecord(code: LegacyErrorCode): LegacyErrorRecord {
  return {
    code,
    slug: getLegacyErrorSlug(code),
    url: getLegacyErrorUrl(code),
    stayOnV8: LEGACY_V8_LINE,
    ...LEGACY_ERRORS[code],
  };
}

/** Every registry entry resolved, in `LEGACY_ERROR_CODES` order, for the site build to enumerate. */
export function getLegacyErrorRecords(): LegacyErrorRecord[] {
  return LEGACY_ERROR_CODES.map(getLegacyErrorRecord);
}
