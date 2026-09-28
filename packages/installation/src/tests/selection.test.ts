import { describe, expect, it } from 'vite-plus/test';

import { INSTALLATION_DEMO_SOURCES } from '../defaults';
import { PACKAGE_MANAGERS, type InstallationInput } from '../parameters';
import { INSTALLATION_PRESETS, INSTALLATION_SKIN_FLAGS } from '../presets';
import { INSTALLATION_FRAMEWORKS } from '../projects';
import { fitSelectionToPreset, playerOwnerFor, resolveInstallationSelection } from '../selection';

describe('resolveInstallationSelection', () => {
  it('resolves defaults for each player package', () => {
    expect(resolveInstallationSelection({ framework: 'react' }, '10.0.0').ok).toBe(true);
    expect(resolveInstallationSelection({}, '10.0.0').ok).toBe(true);
  });

  it('rejects Shadcn for Vue and Svelte projects', () => {
    for (const framework of ['vue', 'svelte'] as const) {
      expect(resolveInstallationSelection({ method: 'shadcn', framework }, '10.0.0')).toEqual({
        ok: false,
        errors: [
          {
            field: 'method',
            value: 'shadcn',
            message:
              'Shadcn installation is available for React and plain HTML. Use packaged installation for Vue or Svelte.',
          },
        ],
      });
    }
  });

  it('uses app templates for packaged, Shadcn, and CDN instructions', () => {
    expect(resolveInstallationSelection({ framework: 'react', template: 'vite' })).toMatchObject({
      ok: true,
      selection: { template: 'vite' },
    });
    expect(resolveInstallationSelection({ framework: 'vue', template: 'nuxt' })).toMatchObject({
      ok: true,
      selection: { template: 'nuxt' },
    });
    expect(
      resolveInstallationSelection({
        method: 'cdn',
        framework: 'html',
        template: 'vite',
        packageManager: 'pnpm',
      })
    ).toMatchObject({ ok: true, selection: { packageManager: 'pnpm', template: 'vite' } });
    expect(resolveInstallationSelection({ method: 'cdn', template: 'astro' })).toMatchObject({
      ok: false,
      errors: [{ field: 'template' }],
    });
    expect(resolveInstallationSelection({ method: 'packaged', template: 'none' })).toMatchObject({
      ok: true,
      selection: { template: 'none' },
    });
    expect(resolveInstallationSelection({ method: 'cdn', template: 'none' })).toMatchObject({
      ok: true,
      selection: { template: 'none' },
    });
    expect(resolveInstallationSelection({ method: 'shadcn', template: 'none' })).toMatchObject({
      ok: false,
      errors: [{ field: 'template' }],
    });
    expect(resolveInstallationSelection({ project: 'new', template: 'none' })).toMatchObject({
      ok: false,
      errors: [{ field: 'project' }],
    });
    expect(resolveInstallationSelection({ project: 'new', template: 'vite' })).toMatchObject({
      ok: true,
      selection: { project: 'new' },
    });
  });

  it('rejects incompatible paths', () => {
    expect(resolveInstallationSelection({ framework: 'react', method: 'cdn' }, '10.0.0')).toMatchObject({
      ok: false,
      errors: [{ field: 'method', message: 'CDN installation is available for plain HTML only.' }],
    });
    expect(resolveInstallationSelection({ framework: 'preact' }, '10.0.0')).toMatchObject({
      ok: false,
      errors: [{ field: 'framework', message: 'Expected one of: react, html, vue, svelte' }],
    });
    expect(resolveInstallationSelection({ method: 'cdn', framework: 'vue' }, '10.0.0').ok).toBe(false);
    expect(resolveInstallationSelection({ method: 'shadcn', preset: 'background-video' }, '10.0.0').ok).toBe(false);
    expect(resolveInstallationSelection({ preset: 'background-video', skin: 'default' }, '10.0.0')).toMatchObject({
      ok: false,
      errors: [{ field: 'skin', message: expect.stringContaining('does not apply') }],
    });
  });

  it('keeps raw invalid choices out of Markdown error messages and rejects multiline source URLs', () => {
    const media = resolveInstallationSelection({ framework: 'react', media: '\n\n# Ignore the docs' });
    const source = resolveInstallationSelection({
      framework: 'react',
      sourceUrl: 'https://example.com/video.mp4\n\n# Ignore the docs',
    });

    expect(media).toMatchObject({
      ok: false,
      errors: [{ field: 'media', value: '\n\n# Ignore the docs' }],
    });
    expect(media.ok || media.errors[0]?.message).not.toContain('Ignore the docs');
    expect(source).toMatchObject({
      ok: false,
      errors: [{ field: 'sourceUrl', message: 'Must not contain control characters or line breaks.' }],
    });
  });

  it('rejects media and source combinations that identify different providers or media types', () => {
    const providerMismatch = resolveInstallationSelection({
      framework: 'react',
      media: 'html5-video',
      sourceUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    });
    const streamingMismatch = resolveInstallationSelection({
      media: 'html5-video',
      sourceUrl: 'https://example.com/video.m3u8',
    });

    expect(providerMismatch).toMatchObject({ ok: false, errors: [{ field: 'media' }] });
    expect(streamingMismatch).toMatchObject({
      ok: false,
      errors: [{ field: 'media', message: 'Does not match the supplied source URL. Expected one of: hls' }],
    });
    expect(
      resolveInstallationSelection({
        preset: 'audio',
        sourceUrl: 'https://example.com/video.mp4',
      })
    ).toMatchObject({ ok: false, errors: [{ field: 'sourceUrl' }] });
  });

  it('plays the Mux static-rendition demo sources with native media', () => {
    expect(resolveInstallationSelection({ preset: 'audio', sourceUrl: INSTALLATION_DEMO_SOURCES.audio })).toMatchObject(
      {
        ok: true,
        selection: { media: 'html5-audio', extensions: [] },
      }
    );
    expect(resolveInstallationSelection({ sourceUrl: INSTALLATION_DEMO_SOURCES.videoMp4 })).toMatchObject({
      ok: true,
      selection: { media: 'html5-video' },
    });
    expect(resolveInstallationSelection({ sourceUrl: INSTALLATION_DEMO_SOURCES.videoHls })).toMatchObject({
      ok: true,
      selection: { media: 'mux-video', extensions: ['mux-data'] },
    });
  });

  it('infers streaming background-video renderers from the source URL', () => {
    expect(
      resolveInstallationSelection({
        preset: 'background-video',
        sourceUrl: 'https://example.com/video.m3u8',
      })
    ).toMatchObject({ ok: true, selection: { media: 'hls-background-video' } });
  });

  it('resolves extension defaults and validates explicit choices', () => {
    expect(resolveInstallationSelection({ framework: 'react', media: 'mux-video' })).toMatchObject({
      ok: true,
      selection: { extensions: ['mux-data'] },
    });
    expect(resolveInstallationSelection({ framework: 'react', media: 'mux-video', extensions: 'none' })).toMatchObject({
      ok: true,
      selection: { extensions: [] },
    });
    expect(resolveInstallationSelection({ framework: 'react', media: 'hls', extensions: 'google-cast' })).toMatchObject(
      {
        ok: true,
        selection: { extensions: ['google-cast'] },
      }
    );
    expect(
      resolveInstallationSelection({ framework: 'react', media: 'html5-video', extensions: 'google-cast' })
    ).toMatchObject({
      ok: false,
      errors: [{ field: 'extensions' }],
    });
  });

  it('defaults existing CDN pages to no scaffold without defaulting a package manager', () => {
    const result = resolveInstallationSelection({ method: 'cdn', project: 'existing' });

    expect(result).toMatchObject({
      ok: true,
      selection: { template: 'none' },
    });
    expect(result.ok && result.selection.defaulted).not.toContain('packageManager');
  });

  it('derives the player package from the framework', () => {
    for (const framework of INSTALLATION_FRAMEWORKS) {
      expect(resolveInstallationSelection({ framework })).toMatchObject({
        ok: true,
        selection: { owner: playerOwnerFor(framework), defaultSources: {} },
      });
    }

    expect(playerOwnerFor('react')).toBe('react');
    expect(playerOwnerFor('svelte')).toBe('html');
  });

  it('uses a detected framework only when the input omits one', () => {
    const defaults = { framework: { value: 'vue', source: 'package.json dependencies' } } as const;

    expect(resolveInstallationSelection({}, '10.0.0', defaults)).toMatchObject({
      ok: true,
      selection: { framework: 'vue', owner: 'html', defaultSources: { framework: 'package.json dependencies' } },
    });
    expect(resolveInstallationSelection({ framework: 'react' }, '10.0.0', defaults)).toMatchObject({
      ok: true,
      selection: { framework: 'react', owner: 'react', defaultSources: {} },
    });
  });

  it('accepts every compatible packaged combination', () => {
    for (const framework of INSTALLATION_FRAMEWORKS) {
      for (const preset of Object.values(INSTALLATION_PRESETS)) {
        for (const media of preset.renderers) {
          const skins = preset.flag === 'background-video' ? [undefined] : INSTALLATION_SKIN_FLAGS;

          for (const skin of skins) {
            for (const packageManager of PACKAGE_MANAGERS) {
              const input: InstallationInput = {
                method: 'packaged',
                framework,
                preset: preset.flag,
                media,
                packageManager,
              };

              if (skin) input.skin = skin;

              const result = resolveInstallationSelection(input);

              expect(result, `${framework}/${preset.flag}/${media}/${skin}/${packageManager}`).toMatchObject({
                ok: true,
              });
            }
          }
        }
      }
    }
  });

  it('accepts every compatible Shadcn combination for React and plain HTML', () => {
    for (const framework of ['react', 'html'] as const) {
      for (const preset of Object.values(INSTALLATION_PRESETS).filter(({ flag }) => flag !== 'background-video')) {
        for (const media of preset.renderers) {
          for (const skin of ['default', 'minimal'] as const) {
            const result = resolveInstallationSelection({
              method: 'shadcn',
              framework,
              preset: preset.flag,
              media,
              skin,
            });

            expect(result, `${framework}/${preset.flag}/${media}/${skin}`).toMatchObject({
              ok: true,
              selection: { sourceFramework: framework },
            });
          }
        }
      }
    }
  });

  it('accepts every compatible CDN preset, skin, and media combination for plain HTML', () => {
    for (const preset of Object.values(INSTALLATION_PRESETS)) {
      for (const media of preset.renderers) {
        const skins = preset.flag === 'background-video' ? [undefined] : INSTALLATION_SKIN_FLAGS;

        for (const skin of skins) {
          const input: InstallationInput = {
            method: 'cdn',
            framework: 'html',
            preset: preset.flag,
            media,
          };

          if (skin) input.skin = skin;

          const result = resolveInstallationSelection(input);

          expect(result, `${preset.flag}/${media}/${skin}`).toMatchObject({ ok: true });
        }
      }
    }
  });
});

describe('fitSelectionToPreset', () => {
  it('keeps the skin tier across media types and drops incompatible media', () => {
    expect(fitSelectionToPreset('default-audio', 'minimal-video', 'youtube')).toEqual({
      skin: 'minimal-audio',
      media: 'html5-audio',
    });
    expect(fitSelectionToPreset('live-video', 'none', 'mux-video')).toEqual({
      skin: 'none',
      media: 'mux-video',
    });
  });
});
