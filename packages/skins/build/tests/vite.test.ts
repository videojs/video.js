import { resolve } from 'node:path';

import { isString, isUndefined } from '@videojs/utils/predicate';
import { createLogger, createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { skinSourceDirectory } from '../skin.ts';

const packageDir = resolve(import.meta.dirname, '../..');
const configFile = resolve(import.meta.dirname, 'vite.config.ts');
const reactTarget = '?style=css&target=react&skin=default-video&theme=default';
const defaultSkinUrl = `/../src/skins/default/video/skin.tsx${reactTarget}`;
const defaultControlsUrl = `/../src/skins/default/video/layout/controls.tsx${reactTarget}`;
const htmlContainerUrl =
  '/../src/components/layout/container.tsx?style=tailwind&target=html&skin=neutral-video&theme=neutral';
const playButtonUrl = `/../src/components/buttons/play-button.tsx${reactTarget}`;
const settingsMenuUrl = `/../src/components/menus/settings-menu.tsx${reactTarget}`;
const reactCaptionsMenuUrl =
  '/../src/components/menus/captions-menu.tsx?style=css&target=react&skin=default-live-video&theme=default';
const htmlCaptionsMenuUrl =
  '/../src/components/menus/captions-menu.tsx?style=css&target=html&skin=default-live-video&theme=default';
const htmlAudioSettingsMenuUrl =
  '/../src/skins/shared/audio/menus/settings-menu.tsx?style=css&target=html&skin=default-audio&theme=default';
const volumePopoverUrl = `/../src/components/menus/volume-popover.tsx${reactTarget}`;
const htmlPosterUrl =
  '/../src/components/display/poster.tsx?style=tailwind&target=html&skin=default-video&theme=default';
const reactPosterUrl =
  '/../src/components/display/poster.tsx?style=tailwind&target=react&skin=default-video&theme=default';
const htmlTimeSliderUrl =
  '/../src/components/sliders/time-slider.tsx?style=tailwind&target=html&skin=default-video&theme=default';
const reactTimeSliderUrl =
  '/../src/components/sliders/time-slider.tsx?style=tailwind&target=react&skin=default-video&theme=default';
const neutralControlsUrl =
  '/../src/skins/neutral/video/layout/controls.tsx?style=tailwind&target=react&skin=neutral-video&theme=neutral';
const buttonStyles = resolve(packageDir, 'src/styles/buttons/button.styles.ts');
const controlsStyles = resolve(packageDir, 'src/skins/default/video/layout/controls.styles.ts');
const designStyles = resolve(packageDir, 'src/styles/base.css');
const skinConfig = resolve(packageDir, 'build/transform.ts');
const vjscPlayButton = resolve(packageDir, 'src/components/buttons/play-button.tsx');
const frameworks = ['react', 'html'] as const;
const skins = [
  'default-video',
  'neutral-video',
  'default-live-video',
  'neutral-live-video',
  'default-live-audio',
  'neutral-live-audio',
  'default-audio',
  'neutral-audio',
] as const;
const skinContracts = {
  'default-video': {
    exportName: 'VideoSkin',
    theme: 'default',
    preset: 'video',
    stylesheet: 'video/controls.css',
  },
  'neutral-video': {
    exportName: 'VideoSkin',
    theme: 'neutral',
    preset: 'video',
    stylesheet: 'video/controls.css',
  },
  'default-live-video': {
    exportName: 'LiveVideoSkin',
    theme: 'default',
    preset: 'live-video',
    stylesheet: 'live-video/controls.css',
  },
  'neutral-live-video': {
    exportName: 'LiveVideoSkin',
    theme: 'neutral',
    preset: 'live-video',
    stylesheet: 'live-video/controls.css',
  },
  // Live audio controls are fully shared with the audio controls module.
  'default-live-audio': {
    exportName: 'LiveAudioSkin',
    theme: 'default',
    preset: 'live-audio',
    stylesheet: 'audio/controls.css',
  },
  'neutral-live-audio': {
    exportName: 'LiveAudioSkin',
    theme: 'neutral',
    preset: 'live-audio',
    stylesheet: 'audio/controls.css',
  },
  'default-audio': {
    exportName: 'AudioSkin',
    theme: 'default',
    preset: 'audio',
    stylesheet: 'audio/controls.css',
  },
  'neutral-audio': {
    exportName: 'AudioSkin',
    theme: 'neutral',
    preset: 'audio',
    stylesheet: 'audio/controls.css',
  },
} as const satisfies Record<
  (typeof skins)[number],
  { exportName: string; theme: string; preset: string; stylesheet: string }
>;
const styles = ['css', 'tailwind'] as const;
const variants = frameworks.flatMap((framework) =>
  skins.flatMap((skin) => styles.map((style) => ({ framework, skin, style })))
);
const logger = createLogger('silent');
const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
const warnOnce = vi.spyOn(logger, 'warnOnce').mockImplementation(() => {});

describe('Skins Vite workflow', () => {
  let server: ViteDevServer;

  beforeAll(async () => {
    server = await createServer({
      configFile,
      customLogger: logger,
      logLevel: 'silent',
      optimizeDeps: { include: [], noDiscovery: true },
      server: { middlewareMode: true },
    });
  }, 120_000);

  beforeEach(() => {
    warn.mockClear();
    warnOnce.mockClear();
  });

  afterAll(async () => {
    await server?.close();
  }, 120_000);

  it('resolves queried skin source directly', async () => {
    const resolved = await server.pluginContainer.resolveId(defaultSkinUrl);

    expect(resolved?.id).toContain(
      '/src/skins/default/video/skin.tsx?skin=default-video&style=css&target=react&theme=default'
    );
  }, 30_000);

  it('reports VJSC style diagnostics through the Vite logger', async () => {
    await server.transformRequest(`${neutralControlsUrl}&diagnostics=1`);
    const warnings = [...warn.mock.calls, ...warnOnce.mock.calls].flat().join('\n');

    expect(warnings).toContain('[VJSC_STYLE_COMPLEX_SELECTOR]');
    expect(warnings).toContain('Reason:');
    expect(warnings).toContain('Recommendation:');
  }, 30_000);

  it('serves every framework, Skin, and style combination', async () => {
    for (const variant of variants) {
      const url = skinUrl(variant);
      const result = await server.transformRequest(url);
      const { exportName: skinExport, theme, preset, stylesheet } = skinContracts[variant.skin];

      expect(result?.code, url).toContain(skinExport);
      expect(result?.code, url).toContain('data-theme');
      expect(result?.code, url).toContain(theme);
      expect(result?.code, url).toContain('data-preset');
      expect(result?.code, url).toContain(preset);
      expect(result?.code, url).not.toContain('vjsc/dist/components/jsx-dev-runtime');
      expect(result?.code, url).not.toContain('@videojs/core/vjsc');

      if (variant.framework === 'react') expect(result?.code, url).toContain('$RefreshReg$');

      const controls = await server.transformRequest(controlsUrl(variant));
      const controlsClass = preset.includes('audio') ? 'audio-controls' : 'video-controls';

      expect(controls?.code, url).toContain(controlsClass);

      if (variant.style === 'css') {
        const code = controls?.code ?? '';
        const controlsStyle = encodeURIComponent(stylesheet);

        expect(code, url).toContain('virtual:vjsc/css');
        expect(code, url).toContain('/base.css');
        expect(code, url).toContain(controlsStyle);
        expect(code.indexOf('/base.css'), url).toBeLessThan(code.indexOf(controlsStyle));
      } else expect(controls?.code, url).not.toContain('virtual:vjsc/css');
    }

    const htmlContainer = await server.transformRequest(htmlContainerUrl);

    expect(htmlContainer?.code).toContain('/src/define/ui/container.ts');
    expect(htmlContainer?.code).toContain('media-skin');
  }, 30_000);

  it('passes trigger props to the concrete React render element', async () => {
    const settingsMenu = await server.transformRequest(settingsMenuUrl);
    const volumePopover = await server.transformRequest(volumePopoverUrl);

    expect(settingsMenu?.code).toContain('children: /* @__PURE__ */ _jsxDEV(Menu.Trigger');
    expect(settingsMenu?.code).toContain('render: /* @__PURE__ */ _jsxDEV(Button');
    expect(settingsMenu?.code).toContain('resolveClassName(className, state)');
    expect(settingsMenu?.code).toContain('media-menu-resizable-popup');
    expect(volumePopover?.code).toContain(
      'VolumePopoverPrimitive.Trigger, { render: /* @__PURE__ */ _jsxDEV(MuteButton'
    );
    expect([...warn.mock.calls, ...warnOnce.mock.calls].flat().join('\n')).not.toContain('emitFile() is not supported');
  }, 30_000);

  it('passes HTML trigger props through the shared component', async () => {
    const settingsMenu = await server.transformRequest(htmlAudioSettingsMenuUrl);
    const code = settingsMenu?.code ?? '';

    expect(code).toContain(
      '/components/buttons/playback-rate-button.tsx?skin=default-audio&style=css&target=html&theme=default'
    );
    expect(code).toMatch(/_jsxDEV\(PlaybackRateButton, \{\s+commandfor:[\s\S]*?className/);
    expect(code).not.toContain('media-menu-resizable-popup');
  }, 30_000);

  it('uses the captions button itself as the menu trigger and labels its tooltip from it', async () => {
    const react = await server.transformRequest(reactCaptionsMenuUrl);
    const html = await server.transformRequest(htmlCaptionsMenuUrl);

    expect(react?.code).toMatch(/_jsxDEV\(MenuPrimitive\.Trigger, \{\s+render: .*_jsxDEV\(CaptionsButton/);
    expect(react?.code).toMatch(/_jsxDEV\(ButtonTooltip, \{[\s\S]*?_jsxDEV\(MenuPrimitive\.Trigger/);
    expect(react?.code).not.toMatch(/_jsxDEV\(ButtonTooltip, \{\s+label:/);
    expect(html?.code).toMatch(/_jsxDEV\(CaptionsButton, \{\s+commandfor:[\s\S]*?className/);
    expect(html?.code).not.toContain('data-vjsc-render-captions-button');
  }, 30_000);

  it('emits base visibility styles for stateful button icons', async () => {
    const transformed = await server.transformRequest(playButtonUrl);
    const cssUrls = [...(transformed?.code ?? '').matchAll(/(?:from\s+)?["']([^"']*virtual:vjsc\/css\/[^"']+)["']/g)]
      .map((match) => match[1]!)
      .filter((url) => url.endsWith('/buttons.css'));

    expect(cssUrls).toHaveLength(1);

    const resolvedId = cssUrls[0]!.replace('/@id/__x00__', '\0');
    const loaded = await server.pluginContainer.load(resolvedId);
    const css = isString(loaded) ? loaded : loaded?.code;
    if (isUndefined(css)) throw new Error(`Expected Vite to load \`${resolvedId}\`.`);

    expect(css).toMatch(
      /\.media-play-button-restart-icon \{\s+scale: var\(--media-hidden-icon-scale\) var\(--media-hidden-icon-scale\);\s+opacity: 0;/
    );
  }, 30_000);

  it.each(frameworks)(
    'renders a title primitive for %s',
    async (target) => {
      const result = await server.transformRequest(
        `/../src/components/display/title.tsx?style=tailwind&target=${target}&skin=default-video&theme=default`
      );

      expect(result?.code).toContain(target === 'html' ? 'media-title' : 'Title');
    },
    30_000
  );

  it('emits title styles in the display stylesheet', async () => {
    const result = await server.transformRequest(`/../src/components/display/title.tsx${reactTarget}`);

    expect(result?.code).toContain('/display.css');
    expect(result?.code).not.toContain('/title.css');
  }, 30_000);

  it('includes Shadow DOM utilities only for HTML targets', async () => {
    const html = await server.transformRequest(htmlPosterUrl);
    const react = await server.transformRequest(reactPosterUrl);

    expect(html?.code).toContain('[&>slot::slotted(img)]:layer-media');
    expect(react?.code).not.toContain('::slotted');
  }, 30_000);

  it('slots the thumbnail image and styles a slotted one only for HTML targets', async () => {
    const html = await server.transformRequest(htmlTimeSliderUrl);
    const react = await server.transformRequest(reactTimeSliderUrl);

    expect(html?.code).toMatch(/name:\s*"thumbnail"/);
    expect(html?.code).toContain('[&>slot::slotted(img)]:block');
    expect(html?.code).toContain('[&[data-loading]>slot::slotted(img)]:opacity-0');
    expect(react?.code).not.toContain('::slotted');
    expect(react?.code).not.toContain('"thumbnail"');
    // React has no slot to fill, so the same override arrives as the image's `render` prop instead.
    expect(react?.code).toMatch(/_jsxDEV\(SliderPrimitive\.Thumbnail\.Image, \{\s+render: renderThumbnail/);
  }, 30_000);

  it('hides source-less poster images for both targets', async () => {
    const html = await server.transformRequest(htmlPosterUrl);
    const react = await server.transformRequest(reactPosterUrl);

    expect(html?.code).toContain('[&:not([src]):not([srcset])]:invisible');
    expect(html?.code).toContain('[&>slot::slotted(img:not([src]):not([srcset]))]:invisible');
    expect(react?.code).toContain('[&:not([src]):not([srcset])]:invisible');
    expect(react?.code).not.toContain('::slotted');
  }, 30_000);

  it('invalidates transformed owners for component, style, and design changes', async () => {
    await server.transformRequest(defaultSkinUrl);
    const resolved = await server.pluginContainer.resolveId(defaultSkinUrl);

    expect(resolved?.id).toContain('/src/skins/default/video/skin.tsx');
    const skinModule = resolved && server.moduleGraph.getModuleById(resolved.id);

    expect(skinModule?.transformResult).not.toBeNull();
    await server.transformRequest(defaultControlsUrl);
    const targetedControlsId = await server.pluginContainer.resolveId(defaultControlsUrl);
    const targetedControls = targetedControlsId && server.moduleGraph.getModuleById(targetedControlsId.id);

    expect(targetedControls?.transformResult).not.toBeNull();
    await server.transformRequest(playButtonUrl);
    const targetedPlayButtonId = await server.pluginContainer.resolveId(`${vjscPlayButton}${reactTarget}`);
    const targetedPlayButton = targetedPlayButtonId && server.moduleGraph.getModuleById(targetedPlayButtonId.id);

    expect(targetedPlayButton).toBeDefined();
    expect(targetedPlayButton?.transformResult).not.toBeNull();

    if (!skinModule || !targetedControls || !targetedPlayButton) throw new Error('Expected targeted VJSC modules.');

    const styleInvalidation = {
      skin: skinModule.lastInvalidationTimestamp,
      component: targetedPlayButton.lastInvalidationTimestamp,
    };

    server.watcher.emit('change', buttonStyles);
    await vi.waitFor(() => {
      expect(skinModule.lastInvalidationTimestamp).toBeGreaterThan(styleInvalidation.skin);
      expect(targetedPlayButton.lastInvalidationTimestamp).toBeGreaterThan(styleInvalidation.component);
    });

    await server.transformRequest(playButtonUrl);
    expect(targetedPlayButton.transformResult).not.toBeNull();

    const controlsInvalidation = {
      skin: skinModule.lastInvalidationTimestamp,
      controls: targetedControls.lastInvalidationTimestamp,
    };

    server.watcher.emit('change', controlsStyles);
    await vi.waitFor(() => {
      expect(skinModule.lastInvalidationTimestamp).toBeGreaterThan(controlsInvalidation.skin);
      expect(targetedControls.lastInvalidationTimestamp).toBeGreaterThan(controlsInvalidation.controls);
    });

    const designInvalidation = targetedPlayButton.lastInvalidationTimestamp;

    server.watcher.emit('change', designStyles);
    await vi.waitFor(() => expect(targetedPlayButton.lastInvalidationTimestamp).toBeGreaterThan(designInvalidation));

    await server.transformRequest(playButtonUrl);
    expect(targetedPlayButton.transformResult).not.toBeNull();

    const sourceInvalidation = targetedPlayButton.lastInvalidationTimestamp;

    server.watcher.emit('change', vjscPlayButton);
    await vi.waitFor(() => expect(targetedPlayButton.lastInvalidationTimestamp).toBeGreaterThan(sourceInvalidation));
  }, 30_000);

  it('restarts when compiler configuration changes', async () => {
    expect(server.config.configFileDependencies).toContain(skinConfig);
    const restart = vi.spyOn(server, 'restart').mockResolvedValue();

    server.watcher.emit('change', skinConfig);
    await vi.waitFor(() => expect(restart).toHaveBeenCalledOnce());
    restart.mockRestore();
  }, 30_000);

  it('serves optimized icon families with the authored element runtime', async () => {
    const resolved = await server.pluginContainer.resolveId('@videojs/icons/element/neutral');
    if (!resolved) throw new Error('Expected the source icon plugin to resolve the neutral family.');

    const loaded = await server.pluginContainer.load(resolved.id);
    const source = isString(loaded) ? loaded : loaded?.code;
    if (isUndefined(source)) throw new Error(`Expected Vite to load \`${resolved.id}\`.`);

    const runtime = resolve(packageDir, '../icons/src/element.ts');
    const transformed = await server.transformRequest(resolved.id);

    expect(source).toContain('aria-hidden');
    expect(source).toContain(runtime);
    expect(transformed?.code).toContain('/@fs/');
    expect(transformed?.code).toContain('MediaIconElement');
    expect(await server.pluginContainer.resolveId(runtime, resolved.id)).toMatchObject({ id: runtime });
  }, 30_000);

  it('does not configure Shadcn output while serving', async () => {
    expect(server.config.plugins.some((plugin) => plugin.name === 'vjsc:registry')).toBe(false);
  }, 30_000);
});

function skinUrl(variant: (typeof variants)[number]): string {
  const { theme } = skinContracts[variant.skin];

  return `/../src/skins/${skinSourceDirectory(variant.skin)}/skin.tsx?style=${variant.style}&target=${variant.framework}&skin=${variant.skin}&theme=${theme}`;
}

function controlsUrl(variant: (typeof variants)[number]): string {
  const { theme } = skinContracts[variant.skin];

  return `/../src/skins/${skinSourceDirectory(variant.skin)}/layout/controls.tsx?style=${variant.style}&target=${variant.framework}&skin=${variant.skin}&theme=${theme}`;
}
