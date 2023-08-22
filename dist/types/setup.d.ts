/**
 * Set up any tags that have a data-setup `attribute` when the player is started.
 */
export function autoSetup(): void;
/**
 * Wait until the page is loaded before running autoSetup. This will be called in
 * autoSetup if `hasLoaded` returns false.
 *
 * @param {number} wait
 *        How long to wait in ms
 *
 * @param {module:videojs} [vjs]
 *        The videojs library function
 */
export function autoSetupTimeout(wait: number, vjs?: any): void;
/**
 * check if the window has been loaded
 */
export function hasLoaded(): boolean;
//# sourceMappingURL=setup.d.ts.map