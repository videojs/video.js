import type { Sidebar } from '@/types/docs';

/**
 * Top-level sections render as tabs at the top of the docs sidebar ("Guide", "Components"). Everything below a tab
 * renders flat: second-level sections are headings, third-level sections are sub-headings. There is nothing to expand
 * or collapse.
 */
export const sidebar: Sidebar = [
  {
    sidebarLabel: 'Guides',
    llmsDescription: 'Installation, migration, concepts, playback guides, customization, and tooling for Video.js.',
    contents: [
      {
        sidebarLabel: 'Getting Started',
        llmsDescription:
          'Install Video.js, customize a skin, understand its main pieces, check browser and AI tool support, and contribute.',
        contents: [
          { slug: 'guides/installation', sidebarLabel: 'Installation' },
          { slug: 'guides/installation-vue', sidebarLabel: 'Install with Vue', frameworks: ['html'], hidden: true },
          {
            slug: 'guides/installation-svelte',
            sidebarLabel: 'Install with Svelte',
            frameworks: ['html'],
            hidden: true,
          },
          { slug: 'guides/installation-shadcn', sidebarLabel: 'Install with Shadcn', hidden: true },
          { slug: 'guides/installation-cdn', sidebarLabel: 'Install from CDN', frameworks: ['html'], hidden: true },
          {
            slug: 'guides/build-your-own-component',
            sidebarLabel: 'Build a component',
            hidden: true,
            // The lifecycle page folded into this guide's cleanup advice.
          },
          { slug: 'guides/architecture' },
          { slug: 'guides/customize-skins', sidebarLabel: 'Customize skins' },
          { slug: 'guides/why-videojs' },
          { slug: 'guides/browser-support' },
          { slug: 'guides/build-with-ai' },
          { slug: 'guides/v10-roadmap', sidebarLabel: 'Roadmap' },
          { href: 'https://github.com/videojs/v10/blob/main/CONTRIBUTING.md', sidebarLabel: 'Contribute to Video.js' },
        ],
      },
      {
        sidebarLabel: 'Frameworks',
        frameworks: ['html'],
        llmsDescription: 'Guides for using the HTML version of Video.js with Vue, Nuxt, Svelte, or SvelteKit.',
        contents: [{ slug: 'guides/vue' }, { slug: 'guides/svelte' }],
      },
      {
        sidebarLabel: 'Environment',
        llmsDescription: {
          react: 'TypeScript, bundlers, and Content Security Policy.',
          html: 'TypeScript, bundlers, the CDN, self-hosting, and Content Security Policy.',
        },
        contents: [
          { slug: 'guides/typescript' },
          { slug: 'guides/bundlers' },
          { slug: 'guides/cdn', frameworks: ['html'] },
          {
            slug: 'guides/self-hosting',
            sidebarLabel: 'Self-hosting',
            frameworks: ['html'],
          },
          {
            slug: 'guides/content-security-policy',
          },
        ],
      },
      {
        sidebarLabel: 'Concepts',
        llmsDescription:
          'Understanding-oriented pages that explain how and why things work. Read these to build a mental model of the library.',
        contents: [
          { slug: 'guides/features' },
          { slug: 'guides/skins' },
          { slug: 'guides/presets' },
          { slug: 'guides/ui-components' },
          { slug: 'guides/accessibility' },
          { slug: 'guides/media-sources' },
        ],
      },
      {
        sidebarLabel: 'Playback',
        llmsDescription:
          'Guides for one player capability each: the recommended setup, how it works, browser constraints, variations, and troubleshooting.',
        contents: [
          { slug: 'guides/autoplay', sidebarLabel: 'Autoplay' },
          { slug: 'guides/controls', sidebarLabel: 'Controls' },
          {
            slug: 'guides/poster',
            sidebarLabel: 'Poster and placeholder',
          },
          {
            slug: 'guides/captions',
            sidebarLabel: 'Captions and subtitles',
          },
          {
            slug: 'guides/keyboard-shortcuts',
            sidebarLabel: 'Keyboard shortcuts and gestures',
          },
          { slug: 'guides/live-streams', sidebarLabel: 'Live streams' },
          { slug: 'guides/quality', sidebarLabel: 'Quality selector' },
          {
            slug: 'guides/fullscreen',
            sidebarLabel: 'Fullscreen and orientation',
          },
          {
            slug: 'guides/picture-in-picture',
            sidebarLabel: 'Picture-in-picture',
          },
          {
            slug: 'guides/thumbnails',
            sidebarLabel: 'Thumbnail previews',
          },
          {
            slug: 'guides/casting',
            sidebarLabel: 'AirPlay and Chromecast',
          },
          {
            slug: 'guides/playback-errors',
            sidebarLabel: 'Playback errors',
          },
          {
            slug: 'guides/user-preferences',
            sidebarLabel: 'User preferences',
          },
          {
            slug: 'guides/background-video',
            sidebarLabel: 'Background video',
          },
          {
            slug: 'guides/internationalization',
            sidebarLabel: 'Internationalization',
          },
          {
            slug: 'guides/mux-data',
            sidebarLabel: 'Mux Data',
          },
        ],
      },
      {
        sidebarLabel: 'Migrate',
        llmsDescription:
          'Guides for moving an existing player integration to Video.js v10, one per player you might be coming from.',
        contents: [
          { slug: 'guides/migrate', sidebarLabel: 'Overview' },
          { slug: 'guides/migrate-from-video-js-8', sidebarLabel: 'Video.js 8' },
          { slug: 'guides/migrate-from-mux-player', sidebarLabel: 'Mux Player' },
          { slug: 'guides/migrate-from-plyr', sidebarLabel: 'Plyr' },
          { slug: 'guides/migrate-from-media-chrome', sidebarLabel: 'Media Chrome' },
          { slug: 'guides/migrate-from-vidstack', sidebarLabel: 'Vidstack' },
          { slug: 'guides/migrate-from-video-react', sidebarLabel: 'Video-React', frameworks: ['react'] },
        ],
      },
    ],
  },
  {
    sidebarLabel: 'Components',
    llmsDescription: 'API reference for skins, media components, extensions, and interface components.',
    contents: [
      {
        sidebarLabel: 'Layout',
        llmsDescription: 'API reference for the components that establish a player and lay out its interface.',
        contents: [
          { slug: 'reference/components/player' },
          { slug: 'reference/components/player-container' },
          { slug: 'reference/components/controls' },
        ],
      },
      {
        sidebarLabel: 'Skins',
        llmsDescription: 'API reference for the packaged skins each preset ships.',
        contents: [
          { slug: 'reference/components/video-skin' },
          { slug: 'reference/components/video-neutral-skin' },
          { slug: 'reference/components/video-compat-skin' },
          { slug: 'reference/components/audio-skin' },
          { slug: 'reference/components/audio-neutral-skin' },
          { slug: 'reference/components/audio-compat-skin' },
          { slug: 'reference/components/live-video-skin' },
          { slug: 'reference/components/live-video-neutral-skin' },
          { slug: 'reference/components/live-video-compat-skin' },
          { slug: 'reference/components/live-audio-skin' },
          { slug: 'reference/components/live-audio-neutral-skin' },
          { slug: 'reference/components/live-audio-compat-skin' },
          { slug: 'reference/components/background-video-skin' },
        ],
      },
      {
        sidebarLabel: 'Media',
        llmsDescription: 'API reference for media components that handle streaming protocols and playback.',
        contents: [
          { slug: 'reference/components/audio' },
          { slug: 'reference/components/background-video' },
          { slug: 'reference/components/cloudflare-video' },
          { slug: 'reference/components/dash-video' },
          { slug: 'reference/components/hls-audio' },
          { slug: 'reference/components/hls-background-video' },
          { slug: 'reference/components/hls-video' },
          { slug: 'reference/components/hlsjs-video' },
          { slug: 'reference/components/mux-audio' },
          { slug: 'reference/components/mux-background-video' },
          { slug: 'reference/components/mux-video' },
          { slug: 'reference/components/native-hls-video' },
          { slug: 'reference/components/shaka-video' },
          { slug: 'reference/components/spotify-audio' },
          { slug: 'reference/components/tiktok-video' },
          { slug: 'reference/components/twitch-video' },
          { slug: 'reference/components/video' },
          { slug: 'reference/components/vimeo-video' },
          { slug: 'reference/components/wistia-video' },
          { slug: 'reference/components/youtube-video' },
        ],
      },
      {
        sidebarLabel: 'Extensions',
        llmsDescription: 'API reference for extensions that connect external services to the player.',
        contents: [{ slug: 'reference/components/google-cast' }, { slug: 'reference/components/mux-data' }],
      },
      {
        sidebarLabel: 'Buttons',
        llmsDescription: 'API reference for the button components that trigger playback actions.',
        contents: [
          { slug: 'reference/components/play-button' },
          { slug: 'reference/components/mute-button' },
          { slug: 'reference/components/seek-button' },
          { slug: 'reference/components/fullscreen-button' },
          { slug: 'reference/components/pip-button' },
          { slug: 'reference/components/captions-button' },
          { slug: 'reference/components/playback-rate-button' },
          { slug: 'reference/components/live-button' },
          { slug: 'reference/components/airplay-button' },
          { slug: 'reference/components/cast-button' },
        ],
      },
      {
        sidebarLabel: 'Sliders',
        llmsDescription: 'API reference for the slider components that scrub time and adjust volume.',
        contents: [
          { slug: 'reference/components/slider' },
          { slug: 'reference/components/time-slider' },
          { slug: 'reference/components/volume-slider' },
        ],
      },
      {
        sidebarLabel: 'Menus',
        llmsDescription:
          'API reference for menus, popovers, and the radio groups that pick tracks, quality, and speed.',
        contents: [
          { slug: 'reference/components/menu' },
          { slug: 'reference/components/popover' },
          { slug: 'reference/components/volume-popover' },
          { slug: 'reference/components/audio-track-radio-group' },
          { slug: 'reference/components/captions-radio-group' },
          { slug: 'reference/components/playback-rate-radio-group' },
          { slug: 'reference/components/quality-radio-group' },
        ],
      },
      {
        sidebarLabel: 'Display',
        llmsDescription: 'API reference for components that display player state, media metadata, and previews.',
        contents: [
          { slug: 'reference/components/time' },
          { slug: 'reference/components/title' },
          { slug: 'reference/components/poster' },
          { slug: 'reference/components/thumbnail' },
          { slug: 'reference/components/tooltip' },
          { slug: 'reference/components/buffering-indicator' },
          { slug: 'reference/components/seek-indicator' },
          { slug: 'reference/components/status-indicator' },
          { slug: 'reference/components/volume-indicator' },
        ],
      },
      {
        sidebarLabel: 'Dialogs',
        llmsDescription: 'API reference for modal dialogs, alerts, and playback error surfaces.',
        contents: [
          { slug: 'reference/components/dialog' },
          { slug: 'reference/components/alert-dialog' },
          { slug: 'reference/components/error-dialog' },
        ],
      },
      {
        sidebarLabel: 'Behavior',
        llmsDescription: 'API reference for the non-visual components that add gestures, hotkeys, and announcements.',
        contents: [
          { slug: 'reference/components/gesture' },
          { slug: 'reference/components/hotkey' },
          { slug: 'reference/components/status-announcer' },
        ],
      },
      {
        sidebarLabel: 'Icons',
        llmsDescription: 'API reference for the icon sets the skins use, available for your own controls.',
        contents: [{ slug: 'reference/components/icons' }],
      },
    ],
  },
  {
    sidebarLabel: 'API',
    llmsDescription: {
      react:
        'API reference for the player factory, presets, store, features, menus, gestures, translation tools, and utilities.',
      html: 'API reference for the player factory, presets, store controllers, features, translation tools, and utilities.',
    },
    contents: [
      {
        sidebarLabel: 'Player',
        llmsDescription: 'API reference for creating a player and reaching it and its container from your own code.',
        contents: [
          { slug: 'reference/api/create-player', frameworks: ['react'] },
          { slug: 'reference/api/html-create-player', sidebarLabel: 'createPlayer', frameworks: ['html'] },
          { slug: 'reference/api/player-controller', frameworks: ['html'] },
          { slug: 'reference/api/ui-element', sidebarLabel: 'UIElement', frameworks: ['html'] },
          { slug: 'reference/api/use-player', frameworks: ['react'] },
          { slug: 'reference/api/use-optional-player', frameworks: ['react'] },
          { slug: 'reference/api/use-media', frameworks: ['react'] },
          { slug: 'reference/api/use-container', frameworks: ['react'] },
          { slug: 'reference/api/use-optional-container', frameworks: ['react'] },
          { slug: 'reference/api/use-container-attach', frameworks: ['react'] },
          { slug: 'reference/api/media-capabilities', sidebarLabel: 'Media capability guards' },
        ],
      },
      {
        sidebarLabel: 'Presets',
        llmsDescription:
          'API reference for the presets: each bundles a player, feature bundle, skins, and media for one use case.',
        contents: [
          { slug: 'reference/api/preset-video', sidebarLabel: 'Video' },
          { slug: 'reference/api/preset-audio', sidebarLabel: 'Audio' },
          { slug: 'reference/api/preset-live-video', sidebarLabel: 'Live video' },
          { slug: 'reference/api/preset-live-audio', sidebarLabel: 'Live audio' },
          { slug: 'reference/api/preset-background', sidebarLabel: 'Background' },
        ],
      },
      {
        sidebarLabel: 'Store',
        llmsDescription: {
          react:
            'API reference for reading and subscribing to player state: selectors, the store hooks, and snapshots.',
          html: 'API reference for reading and subscribing to player state: selectors and the store controllers.',
        },
        contents: [
          { slug: 'reference/api/player-store', sidebarLabel: 'Overview' },
          { slug: 'reference/api/create-selector' },
          { slug: 'reference/api/use-store', frameworks: ['react'] },
          { slug: 'reference/api/use-selector', frameworks: ['react'] },
          { slug: 'reference/api/use-snapshot', frameworks: ['react'] },
          { slug: 'reference/api/store-controller', frameworks: ['html'] },
          { slug: 'reference/api/snapshot-controller', frameworks: ['html'] },
          { slug: 'reference/api/subscription-controller', frameworks: ['html'] },
        ],
      },
      {
        sidebarLabel: 'Features',
        llmsDescription:
          'API reference for the feature modules passed to createPlayer, which provide player capabilities and state.',
        contents: [
          { slug: 'reference/api/feature-buffer' },
          { slug: 'reference/api/feature-controls' },
          { slug: 'reference/api/feature-error' },
          { slug: 'reference/api/feature-fullscreen' },
          { slug: 'reference/api/feature-live' },
          { slug: 'reference/api/feature-metadata' },
          { slug: 'reference/api/feature-orientation-lock' },
          { slug: 'reference/api/feature-pip', sidebarLabel: 'Picture-in-picture' },
          { slug: 'reference/api/feature-playback' },
          { slug: 'reference/api/feature-playback-rate' },
          { slug: 'reference/api/feature-quality' },
          { slug: 'reference/api/feature-audio-track' },
          { slug: 'reference/api/feature-remote-playback' },
          { slug: 'reference/api/feature-source' },
          { slug: 'reference/api/feature-stream-type' },
          { slug: 'reference/api/feature-text-tracks' },
          { slug: 'reference/api/feature-time' },
          { slug: 'reference/api/feature-volume' },
        ],
      },
      {
        sidebarLabel: 'Menu',
        frameworks: ['react'],
        llmsDescription: 'API reference for the option lists behind the track, quality, and speed menus.',
        contents: [
          { slug: 'reference/api/use-audio-track-options', frameworks: ['react'] },
          { slug: 'reference/api/use-captions-options', frameworks: ['react'] },
          { slug: 'reference/api/use-playback-rate-options', frameworks: ['react'] },
          { slug: 'reference/api/use-quality-options', frameworks: ['react'] },
        ],
      },
      {
        sidebarLabel: 'Gestures',
        frameworks: ['react'],
        llmsDescription: 'API reference for tap and double-tap gestures and keyboard hotkeys.',
        contents: [
          { slug: 'reference/api/use-tap-gesture', frameworks: ['react'] },
          { slug: 'reference/api/use-double-tap-gesture', frameworks: ['react'] },
          { slug: 'reference/api/use-hotkey', frameworks: ['react'] },
          { slug: 'reference/api/use-hotkey-shortcut', frameworks: ['react'] },
        ],
      },
      {
        sidebarLabel: 'i18n',
        llmsDescription: {
          react: 'API reference for translating the player: the provider, hooks, and the phrase registry.',
          html: 'API reference for translating the player: the i18n elements, controller, and the phrase registry.',
        },
        contents: [
          { slug: 'reference/api/i18n-provider', frameworks: ['react'] },
          { slug: 'reference/api/create-i18n' },
          { slug: 'reference/api/use-translator', frameworks: ['react'] },
          { slug: 'reference/api/use-locale', frameworks: ['react'] },
          { slug: 'reference/api/media-i18n', sidebarLabel: 'media-i18n', frameworks: ['html'] },
          { slug: 'reference/api/media-text', sidebarLabel: 'media-text', frameworks: ['html'] },
          { slug: 'reference/api/translation-phrases' },
          { slug: 'reference/api/register-i18n', sidebarLabel: 'registerI18n' },
          { slug: 'reference/api/get-i18n-translations', sidebarLabel: 'getI18nTranslations' },
          { slug: 'reference/api/has-registered-locale', sidebarLabel: 'hasRegisteredLocale' },
          { slug: 'reference/api/on-i18n-registry-change', sidebarLabel: 'onI18nRegistryChange' },
          { slug: 'reference/api/create-translator', sidebarLabel: 'createTranslator' },
          { slug: 'reference/api/translate-text', sidebarLabel: 'translateText' },
          { slug: 'reference/api/resolve-translation', sidebarLabel: 'resolveTranslation' },
          { slug: 'reference/api/is-text', sidebarLabel: 'isText' },
          { slug: 'reference/api/load-locale', sidebarLabel: 'loadLocale' },
          { slug: 'reference/api/get-locale-key', sidebarLabel: 'getLocaleKey' },
          { slug: 'reference/api/find-locale-keys', sidebarLabel: 'findLocaleKeys' },
          { slug: 'reference/api/i18n-controller', sidebarLabel: 'I18nController', frameworks: ['html'] },
        ],
      },
      {
        sidebarLabel: 'Utils',
        llmsDescription: {
          react:
            'Lower-level building blocks: adapter and MIME type resolution, and refs, buttons, sliders, and rendering for custom components.',
          html: 'Lower-level building blocks: adapter and MIME type resolution, and the keyboard shortcut controller for custom components.',
        },
        contents: [
          { slug: 'reference/api/resolve-adapter-type', sidebarLabel: 'resolveAdapterType' },
          { slug: 'reference/api/resolve-mime-type', sidebarLabel: 'resolveMimeType' },
          { slug: 'reference/api/use-button', frameworks: ['react'] },
          { slug: 'reference/api/use-slider', frameworks: ['react'] },
          { slug: 'reference/api/use-composed-refs', frameworks: ['react'] },
          { slug: 'reference/api/use-latest-ref', frameworks: ['react'] },
          { slug: 'reference/api/use-destroy', frameworks: ['react'] },
          { slug: 'reference/api/merge-props', frameworks: ['react'] },
          { slug: 'reference/api/render-element', frameworks: ['react'] },
          { slug: 'reference/api/aria-key-shortcuts-controller', frameworks: ['html'] },
        ],
      },
      {
        sidebarLabel: 'Error codes',
        llmsDescription: 'Reference for codes thrown when Video.js 8 APIs are used with the Video.js 10 package.',
        contents: [
          { slug: 'reference/api/error-codes', sidebarLabel: 'Overview' },
          { slug: 'reference/api/vjs8-legacy-init', sidebarLabel: 'VJS8_LEGACY_INIT' },
          { slug: 'reference/api/vjs8-legacy-plugin', sidebarLabel: 'VJS8_LEGACY_PLUGIN' },
          { slug: 'reference/api/vjs8-legacy-component', sidebarLabel: 'VJS8_LEGACY_COMPONENT' },
          { slug: 'reference/api/vjs8-legacy-get-player', sidebarLabel: 'VJS8_LEGACY_GET_PLAYER' },
          { slug: 'reference/api/vjs8-legacy-options', sidebarLabel: 'VJS8_LEGACY_OPTIONS' },
        ],
      },
    ],
  },
  {
    sidebarLabel: 'Writing Style',
    devOnly: true,
    llmsDescription: 'Guides for people writing this documentation site.',
    contents: [
      {
        sidebarLabel: 'Authoring',
        contents: [
          { slug: 'writing-style/write-guides', sidebarLabel: 'Writing guides' },
          { slug: 'writing-style/write-references', sidebarLabel: 'Writing references' },
        ],
      },
    ],
  },
];
