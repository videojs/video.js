export default MediaError;
/**
 * A Custom `MediaError` class which mimics the standard HTML5 `MediaError` class.
 *
 * @param {number|string|Object|MediaError} value
 *        This can be of multiple types:
 *        - number: should be a standard error code
 *        - string: an error message (the code will be 0)
 *        - Object: arbitrary properties
 *        - `MediaError` (native): used to populate a video.js `MediaError` object
 *        - `MediaError` (video.js): will return itself if it's already a
 *          video.js `MediaError` object.
 *
 * @see [MediaError Spec]{@link https://dev.w3.org/html5/spec-author-view/video.html#mediaerror}
 * @see [Encrypted MediaError Spec]{@link https://www.w3.org/TR/2013/WD-encrypted-media-20130510/#error-codes}
 *
 * @class MediaError
 */
declare function MediaError(value: number | string | any | MediaError): MediaError;
declare class MediaError {
    /**
     * A Custom `MediaError` class which mimics the standard HTML5 `MediaError` class.
     *
     * @param {number|string|Object|MediaError} value
     *        This can be of multiple types:
     *        - number: should be a standard error code
     *        - string: an error message (the code will be 0)
     *        - Object: arbitrary properties
     *        - `MediaError` (native): used to populate a video.js `MediaError` object
     *        - `MediaError` (video.js): will return itself if it's already a
     *          video.js `MediaError` object.
     *
     * @see [MediaError Spec]{@link https://dev.w3.org/html5/spec-author-view/video.html#mediaerror}
     * @see [Encrypted MediaError Spec]{@link https://www.w3.org/TR/2013/WD-encrypted-media-20130510/#error-codes}
     *
     * @class MediaError
     */
    constructor(value: number | string | any | MediaError);
    code: number;
    message: string;
    /**
     * An optional status code that can be set by plugins to allow even more detail about
     * the error. For example a plugin might provide a specific HTTP status code and an
     * error message for that code. Then when the plugin gets that error this class will
     * know how to display an error message for it. This allows a custom message to show
     * up on the `Player` error overlay.
     *
     * @type {Array}
     */
    status: any[];
}
declare namespace MediaError {
    /**
     * *
     */
    type errorTypes = any[];
    const errorTypes: string[];
    const defaultMessages: any[];
}
//# sourceMappingURL=media-error.d.ts.map