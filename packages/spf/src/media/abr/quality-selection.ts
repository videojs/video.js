/** Shared ABR tuning and pixel-area arithmetic for the active track-switching rules. */

/** Quality selection configuration. */
export interface QualityConfig {
  /**
   * Safety margin (0-1). To select a track, need: currentBandwidth >= track.bandwidth / safetyMargin. Default 0.85
   * means track must use ≤85% of available bandwidth (15% headroom).
   */
  safetyMargin: number;
  /**
   * Upgrade hysteresis ratio (>= 1). When `currentTrack` is supplied, an upgrade is applied only if `optimal.bandwidth
   *
   * > = currentTrack.bandwidth * upgradeMargin`. Downgrades are always applied. Default 1.15 means optimal must clear the
   * > current bandwidth by at least 15% to trigger an upgrade.
   */
  upgradeMargin: number;
}

/** Default quality selection configuration. Values match Shaka Player upgrade threshold (0.85 = 15% headroom). */
export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  safetyMargin: 0.85,
  upgradeMargin: 1.15,
};

/**
 * Resolution as a total pixel count (`width × height`), the basis for comparing two tracks at the same bitrate. Missing
 * dimensions count as 0, so tracks without resolution metadata (e.g. audio) area-compare equal.
 */
export function resolutionArea(track: { width?: number; height?: number }): number {
  return (track.width ?? 0) * (track.height ?? 0);
}
