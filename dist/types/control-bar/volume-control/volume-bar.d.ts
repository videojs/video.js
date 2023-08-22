export default VolumeBar;
/**
 * The bar that contains the volume level and can be clicked on to adjust the level
 *
 * @extends Slider
 */
declare class VolumeBar extends Slider {
    /**
     * Create the `Component`'s DOM element
     *
     * @return {Element}
     *         The element that was created.
     */
    createEl(): Element;
    /**
     * Handle mouse down on volume bar
     *
     * @param {Event} event
     *        The `mousedown` event that caused this to run.
     *
     * @listens mousedown
     */
    handleMouseDown(event: Event): void;
    /**
     * Handle movement events on the {@link VolumeMenuButton}.
     *
     * @param {Event} event
     *        The event that caused this function to run.
     *
     * @listens mousemove
     */
    handleMouseMove(event: Event): void;
    /**
     * If the player is muted unmute it.
     */
    checkMuted(): void;
    /**
     * Get percent of volume level
     *
     * @return {number}
     *         Volume level percent as a decimal number.
     */
    getPercent(): number;
    /**
     * Increase volume level for keyboard users
     */
    stepForward(): void;
    /**
     * Decrease volume level for keyboard users
     */
    stepBack(): void;
    /**
     * Update ARIA accessibility attributes
     *
     * @param {Event} [event]
     *        The `volumechange` event that caused this function to run.
     *
     * @listens Player#volumechange
     */
    updateARIAAttributes(event?: Event): void;
    /**
     * Returns the current value of the player volume as a percentage
     *
     * @private
     */
    private volumeAsPercentage_;
    /**
     * When user starts dragging the VolumeBar, store the volume and listen for
     * the end of the drag. When the drag ends, if the volume was set to zero,
     * set lastVolume to the stored volume.
     *
     * @listens slideractive
     * @private
     */
    private updateLastVolume_;
    /**
     * Call the update event for this Slider when this event happens on the player.
     *
     * @type {string}
     */
    playerEvent: string;
}
import Slider from "../../slider/slider.js";
//# sourceMappingURL=volume-bar.d.ts.map