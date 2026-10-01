import { cdnBaseForVersion } from './defaults';
import { defaultInstallationExtensions, getInstallationExtension, type InstallationExtension } from './extensions';
import { getInstallationPreset, type Skin, type UseCase } from './presets';
import { getMediaSubpath, RENDERERS, type Renderer } from './renderers';

// Every installation preset ships default, neutral, and skinless CDN bundles.
// The skinless bundle is named for the element it defines (e.g. `video-player`).
// Background video is the exception: all skin choices resolve to one bundle.
function getCdnFileName(useCase: UseCase, skin: Skin): string {
  const { group } = getInstallationPreset(useCase);

  if (useCase === 'background-video') return group;

  if (skin === 'none') return `${group}-player`;

  if (skin === 'neutral-video' || skin === 'neutral-audio') return `${group}-neutral`;

  return group;
}

// Whether a renderer can be installed via CDN, given the canonical set of media
// subpaths the CDN build republishes. Preset renderers need no separate media
// script; media renderers require their subpath in that set.
export function rendererSupportsCdn(renderer: Renderer, cdnMediaSubpaths: readonly string[]): boolean {
  const subpath = getMediaSubpath(renderer);

  return subpath === null || cdnMediaSubpaths.includes(subpath);
}

// Renderers with no CDN install path at all. Prose reads this instead of listing
// them, so a media type that gains a CDN bundle drops out without another edit.
export function renderersWithoutCdn(cdnMediaSubpaths: readonly string[]): Renderer[] {
  return RENDERERS.filter((renderer) => !rendererSupportsCdn(renderer, cdnMediaSubpaths));
}

export function generateCdnCode(
  useCase: UseCase,
  skin: Skin,
  renderer: Renderer,
  cdnMediaSubpaths: readonly string[],
  cdnBase = cdnBaseForVersion(),
  extensions: readonly InstallationExtension[] = defaultInstallationExtensions(renderer)
): string {
  const name = getCdnFileName(useCase, skin);
  const mediaSubpath = getMediaSubpath(renderer);

  const scriptLines = [`<script type="module" src="${cdnBase}/${name}.js"></script>`];

  if (skin === 'none') {
    scriptLines.push(`<script type="module" src="${cdnBase}/ui/container.js"></script>`);
  }

  // Emit a media script only when that media ships a CDN build. A media renderer
  // whose subpath is absent gets only the preset script.
  if (mediaSubpath !== null && cdnMediaSubpaths.includes(mediaSubpath)) {
    scriptLines.push(`<script type="module" src="${cdnBase}/media/${mediaSubpath}.js"></script>`);
  }

  // Extensions live outside the media subpath set and `@videojs/cdn` always
  // ships them, so they are not gated by that set.
  for (const extension of extensions) {
    const { htmlSubpath } = getInstallationExtension(extension);

    scriptLines.push(`<script type="module" src="${cdnBase}/extensions/${htmlSubpath}.js"></script>`);
  }

  return scriptLines.join('\n');
}
