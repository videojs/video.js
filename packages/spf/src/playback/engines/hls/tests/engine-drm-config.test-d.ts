/**
 * Type-level guard on the `drm` / `keySystems` relationship: `drm` may only name ids the composed modules claim.
 *
 * This replaced a dev-only runtime warning. An entry for a system no composed module claims can never be negotiated —
 * `keySystemCandidates` intersects the two — and nothing at runtime notices; the source just refuses as if unlicensed.
 * Carrying each shipped module's id as a literal type lets the engine config say so before the code runs.
 */
import { describe, it } from 'vite-plus/test';

import { clearKeySystem, widevineKeySystem } from '../../../../media/dom/key-systems';
import type { DrmSystemsConfig, KeySystemModule } from '../../../../media/drm';
import { createEngine } from '../engine';

const server = { licenseUrl: 'https://license.example.com' };

describe('EngineConfig drm keys', () => {
  it('are the default systems when keySystems is omitted', () => {
    createEngine({ drm: { 'com.widevine.alpha': server, 'com.apple.fps': server } });
    // @ts-expect-error — a typo no composed module claims
    createEngine({ drm: { 'com.widevine.alpa': server } });
    // @ts-expect-error — a real system, but not a default one
    createEngine({ drm: { 'org.w3.clearkey': server } });
  });

  it('follow a narrowed keySystems tuple', () => {
    createEngine({ keySystems: [clearKeySystem], drm: { 'org.w3.clearkey': server } });
    createEngine({ keySystems: [widevineKeySystem, clearKeySystem], drm: { 'com.widevine.alpha': server } });
    // @ts-expect-error — composed only Clear Key, so Widevine can never be negotiated
    createEngine({ keySystems: [clearKeySystem], drm: { 'com.widevine.alpha': server } });
  });

  it('widen to any id when the modules are not literally typed', () => {
    const custom: KeySystemModule = { ...clearKeySystem, keySystem: 'com.example.custom' };
    const systems: readonly KeySystemModule[] = [custom];

    createEngine({ keySystems: systems, drm: { 'com.example.custom': server } });
  });

  it('accept the runtime source-shaped config, which is keyed by any id', () => {
    const fromSource: DrmSystemsConfig = {};

    createEngine({ drm: fromSource });
  });
});
