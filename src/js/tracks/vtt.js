/**
 * @file vtt.js
 */
import vttjs from 'videojs-vtt.js';
import Component from '../component.js';
import mergeOptions from '../utils/merge-options.js';
import window from 'global/window';
import document from 'global/document';
import {isPlainEmpty} from '../utils/obj.js';

let loadedCallback;

export let vttjsLoaded = !isPlainEmpty(vttjs) ||
                         typeof window.WebVTT === 'function';

/**
 * The `VttLoader` is the `Component` that decides how to load in vttjs
 *
 * @extends Component
 * @fires VttLoader#vttjsloaded
 * @fires VttLoader#vttjserror
 */
class VttLoader extends Component {
  constructor(player, options, ready) {
    const options_ = mergeOptions({createEl: false}, options);

    super(player, options_, ready);

    if (vttjsLoaded) {
      this.setVttjs(vttjs);
      this.triggerLoaded();
    } else {
      this.setVttjs(null);

      player.on('ready', () => {
        if (!player.tech_.featuresNativeTextTracks) {
          this.loadRemoteVtt();
        }
      });
    }
  }

  setVttjs(newVttjs) {
    VttLoader.vttjs = newVttjs;
  }

  triggerLoaded() {
    vttjsLoaded = true;

    /**
     * Fired when vtt.js is loaded.
     *
     * @event VttLoader#vttjsloaded
     * @type {EventTarget~Event}
     */
    this.trigger('vttjsloaded');

    this.player_.ready(() => {
      /**
       * Fired when vtt.js is loaded.
       *
       * @event Tech#vttjsloaded
       * @type {EventTarget~Event}
       */
      this.player_.tech_.trigger('vttjsloaded');
    }, true);

    if (loadedCallback) {
      // eslint-disable-next-line no-use-before-define
      loadedCallback(getVttjs());
    }
  }

  triggerError() {
    vttjsLoaded = false;

    /**
     * Fired when vtt.js was not loaded due to an error
     *
     * @event VttLoader#vttjserror
     * @type {EventTarget~Event}
     */
    this.trigger('vttjserror');

    this.player_.ready(() => {
      /**
       * Fired when vtt.js was not loaded due to an error
       *
       * @event Tech#vttjserror
       * @type {EventTarget~Event}
       */
      this.player_.tech_.trigger('vttjserror');
    }, true);
  }

  loadRemoteVtt() {
    // load vtt.js via the script location option or the cdn of no location was passed in
    const script = document.createElement('script');

    script.src = this.options_.playerOptions['vtt.js'] || 'https://vjs.zencdn.net/vttjs/0.12.3/vtt.min.js';

    script.onload = () => {
      this.setVttjs(window.vttjs);
      this.triggerLoaded();
    };

    script.onerror = () => {
      this.triggerError();
    };

    this.on('dispose', () => {
      script.onload = null;
      script.onerror = null;
    });

    // but have not loaded yet and we set it to true before the inject so that
    // we don't overwrite the injected window.WebVTT if it loads right away
    window.WebVTT = true;

    this.player().el().appendChild(script);
  }
}

VttLoader.vttjs = vttjsLoaded ? window.vttjs : null;

export const getVttjs = () => VttLoader.vttjs;
export const onLoad = (callback) => {
  if (vttjsLoaded) {
    window.setTimeout(() => callback(getVttjs()), 0);
  } else {
    loadedCallback = callback;
  }
};

Component.registerComponent('VttLoader', VttLoader);
export default VttLoader;
