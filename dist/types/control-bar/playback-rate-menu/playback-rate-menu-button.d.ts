export default PlaybackRateMenuButton;
/**
 * The component for controlling the playback rate.
 *
 * @extends MenuButton
 */
declare class PlaybackRateMenuButton extends MenuButton {
    labelElId_: string;
    labelEl_: Element;
    /**
     * Create the list of menu items. Specific to each subclass.
     *
     */
    createItems(): PlaybackRateMenuItem[];
    /**
     * On playbackrateschange, update the menu to account for the new items.
     *
     * @listens Player#playbackrateschange
     */
    handlePlaybackRateschange(event: any): void;
    /**
     * Get possible playback rates
     *
     * @return {Array}
     *         All possible playback rates
     */
    playbackRates(): any[];
    /**
     * Get whether playback rates is supported by the tech
     * and an array of playback rates exists
     *
     * @return {boolean}
     *         Whether changing playback rate is supported
     */
    playbackRateSupported(): boolean;
    /**
     * Hide playback rate controls when they're no playback rate options to select
     *
     * @param {Event} [event]
     *        The event that caused this function to run.
     *
     * @listens Player#loadstart
     */
    updateVisibility(event?: Event): void;
    /**
     * Update button label when rate changed
     *
     * @param {Event} [event]
     *        The event that caused this function to run.
     *
     * @listens Player#ratechange
     */
    updateLabel(event?: Event): void;
    /**
     * The text that should display over the `PlaybackRateMenuButton`s controls.
     *
     * Added for localization.
     *
     * @type {string}
     * @protected
     */
    protected controlText_: string;
}
import MenuButton from "../../menu/menu-button.js";
import PlaybackRateMenuItem from "./playback-rate-menu-item.js";
//# sourceMappingURL=playback-rate-menu-button.d.ts.map