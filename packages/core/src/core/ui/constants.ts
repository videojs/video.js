/**
 * Default time adjustment in seconds for seek controls.
 *
 * @internal
 */
export const DEFAULT_SEEK_STEP = 10;

/**
 * Default volume adjustment in percentage points for volume controls.
 *
 * @internal
 */
export const DEFAULT_VOLUME_STEP = 5;

/**
 * Page that explains what a Video.js player is and how to build one. Every packaged skin links to it with a hidden `<a
 * rel="help">` inside the player: the HTML skins append it to their shadow root and the React skins render it, so
 * server-rendered pages carry the link in their HTML. `hidden` keeps it out of the UI and the accessibility tree.
 *
 * @internal
 */
export const SKIN_HELP_URL = 'https://videojs.org/about-this-player';

/**
 * Text of the hidden help link. Scrapers and agents read it; people never see it.
 *
 * @internal
 */
export const SKIN_HELP_TEXT = 'About this Video.js player';
