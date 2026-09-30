import { type AdapterType, resolveAdapterType } from '@videojs/media';

import type { UseCase } from './presets';
import { getInstallationPreset } from './presets';
import { getInstallationRenderer, type Renderer } from './renderers';

// Candidate order within an adapter type lets the selected use case choose video, audio, or background playback.
const ADAPTER_TYPE_RENDERERS: Record<AdapterType, readonly Renderer[]> = {
  youtube: ['youtube'],
  vimeo: ['vimeo'],
  // No Wistia renderer is offered yet.
  wistia: [],
  mux: ['mux-video', 'mux-audio', 'mux-background-video'],
  cloudflare: ['cloudflare'],
  spotify: ['spotify'],
  tiktok: ['tiktok'],
  twitch: ['twitch'],
  hls: ['hls', 'hls-background-video'],
  dash: ['dash'],
  video: ['html5-video', 'background-video'],
  audio: ['html5-audio'],
};

/** Renderers whose accepted source shape matches a URL: its adapter type's, then the generic stream renderers. */
export function resolveRendererCandidates(url: string): readonly Renderer[] {
  const type = resolveAdapterType(url);
  if (!type) return [];

  // A Mux or Cloudflare manifest, such as an `.m3u8`, also plays in the generic stream renderers. The file
  // name alone carries no host, so it resolves by extension.
  const fileName = url.split(/[?#]/, 1)[0]!.split('/').pop();
  const fileType = fileName ? resolveAdapterType(fileName) : null;

  return [...new Set([...ADAPTER_TYPE_RENDERERS[type], ...(fileType ? ADAPTER_TYPE_RENDERERS[fileType] : [])])];
}

/** The first renderer for a URL that the use case offers. */
export function resolveRenderer(url: string, useCase: UseCase): Renderer | null {
  return resolveRendererCandidates(url).find((candidate) => isRendererValidForUseCase(candidate, useCase)) ?? null;
}

export function isRendererValidForUseCase(renderer: Renderer, useCase: UseCase): boolean {
  return getInstallationPreset(useCase).renderers.includes(renderer);
}

export function articleFor(renderer: Renderer): 'a' | 'an' {
  return getInstallationRenderer(renderer).article;
}
