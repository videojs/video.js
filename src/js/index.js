import videojs from './video';
import '@videojs/http-streaming';

// Prefer to use MSE for playback over native
videojs.options.hls.overrideNative = !videojs.browser.IS_ANY_SAFARI;

export default videojs;
