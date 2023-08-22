export default SkipBackward;
/**
 * Button to skip backward a configurable amount of time
 * through a video. Renders in the control bar.
 *
 *  * e.g. options: {controlBar: {skipButtons: backward: 5}}
 *
 * @extends Button
 */
declare class SkipBackward extends Button {
    constructor(player: any, options: any);
    validOptions: number[];
    skipTime: any;
    getSkipBackwardTime(): any;
    /**
     * On click, skips backward in the video by a configurable amount of seconds.
     * If the current time in the video is less than the configured 'skip backward' time,
     * skips to beginning of video or seekable range.
     *
     * Handle a click on a `SkipBackward` button
     *
     * @param {EventTarget~Event} event
     *        The `click` event that caused this function
     *        to be called
     */
    handleClick(event: any): void;
}
import Button from "../../button";
//# sourceMappingURL=skip-backward.d.ts.map