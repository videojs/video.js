export default SkipForward;
/**
 * Button to skip forward a configurable amount of time
 * through a video. Renders in the control bar.
 *
 * e.g. options: {controlBar: {skipButtons: forward: 5}}
 *
 * @extends Button
 */
declare class SkipForward extends Button {
    constructor(player: any, options: any);
    validOptions: number[];
    skipTime: any;
    getSkipForwardTime(): any;
    /**
     * On click, skips forward in the duration/seekable range by a configurable amount of seconds.
     * If the time left in the duration/seekable range is less than the configured 'skip forward' time,
     * skips to end of duration/seekable range.
     *
     * Handle a click on a `SkipForward` button
     *
     * @param {EventTarget~Event} event
     *        The `click` event that caused this function
     *        to be called
     */
    handleClick(event: any): void;
}
import Button from "../../button";
//# sourceMappingURL=skip-forward.d.ts.map