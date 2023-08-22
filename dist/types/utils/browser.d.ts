/**
 * Whether or not this device is an iPod.
 *
 * @static
 * @type {Boolean}
 */
export let IS_IPOD: boolean;
/**
 * The detected iOS version - or `null`.
 *
 * @static
 * @type {string|null}
 */
export let IOS_VERSION: string | null;
/**
 * Whether or not this is an Android device.
 *
 * @static
 * @type {Boolean}
 */
export let IS_ANDROID: boolean;
/**
 * The detected Android version - or `null` if not Android or indeterminable.
 *
 * @static
 * @type {number|string|null}
 */
export let ANDROID_VERSION: number | string | null;
/**
 * Whether or not this is Mozilla Firefox.
 *
 * @static
 * @type {Boolean}
 */
export let IS_FIREFOX: boolean;
/**
 * Whether or not this is Microsoft Edge.
 *
 * @static
 * @type {Boolean}
 */
export let IS_EDGE: boolean;
/**
 * Whether or not this is any Chromium Browser
 *
 * @static
 * @type {Boolean}
 */
export let IS_CHROMIUM: boolean;
/**
 * Whether or not this is any Chromium browser that is not Edge.
 *
 * This will also be `true` for Chrome on iOS, which will have different support
 * as it is actually Safari under the hood.
 *
 * Deprecated, as the behaviour to not match Edge was to prevent Legacy Edge's UA matching.
 * IS_CHROMIUM should be used instead.
 * "Chromium but not Edge" could be explicitly tested with IS_CHROMIUM && !IS_EDGE
 *
 * @static
 * @deprecated
 * @type {Boolean}
 */
export let IS_CHROME: boolean;
/**
 * The detected Chromium version - or `null`.
 *
 * @static
 * @type {number|null}
 */
export let CHROMIUM_VERSION: number | null;
/**
 * The detected Google Chrome version - or `null`.
 * This has always been the _Chromium_ version, i.e. would return on Chromium Edge.
 * Deprecated, use CHROMIUM_VERSION instead.
 *
 * @static
 * @deprecated
 * @type {number|null}
 */
export let CHROME_VERSION: number | null;
/**
 * The detected Internet Explorer version - or `null`.
 *
 * @static
 * @deprecated
 * @type {number|null}
 */
export let IE_VERSION: number | null;
/**
 * Whether or not this is desktop Safari.
 *
 * @static
 * @type {Boolean}
 */
export let IS_SAFARI: boolean;
/**
 * Whether or not this is a Windows machine.
 *
 * @static
 * @type {Boolean}
 */
export let IS_WINDOWS: boolean;
/**
 * Whether or not this device is an iPad.
 *
 * @static
 * @type {Boolean}
 */
export let IS_IPAD: boolean;
/**
 * Whether or not this device is an iPhone.
 *
 * @static
 * @type {Boolean}
 */
export let IS_IPHONE: boolean;
/**
 * Whether or not this device is touch-enabled.
 *
 * @static
 * @const
 * @type {Boolean}
 */
export const TOUCH_ENABLED: boolean;
/**
 * Whether or not this is an iOS device.
 *
 * @static
 * @const
 * @type {Boolean}
 */
export const IS_IOS: boolean;
/**
 * Whether or not this is any flavor of Safari - including iOS.
 *
 * @static
 * @const
 * @type {Boolean}
 */
export const IS_ANY_SAFARI: boolean;
//# sourceMappingURL=browser.d.ts.map