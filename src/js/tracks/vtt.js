/**
 * @file vtt.js
 */
import vttjs from 'videojs-vtt.js';
import Component from '../component.js';
import mergeOptions from '../utils/merge-options.js';
import window from 'global/window';
import document from 'global/document';
import {isPlainEmpty} from '../utils/obj.js';

export let vttjsLoaded = !isPlainEmpty(vttjs);

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

    if (isPlainEmpty(vttjs)) {
      this.setVttjs(null);

      player.on('ready', () => {
        if (!player.tech_.featuresNativeTextTracks) {
          this.loadRemoteVtt();
        }
      });
    } else {
      this.setVttjs(vttjs);
      this.trigger('vttjsloaded');
    }
  }

  setVttjs(newVttjs) {
    this.vttjs = newVttjs;
    VttLoader.vttjs = newVttjs;
  }

  triggerLoaded() {
    /**
     * Fired when vtt.js is loaded.
     *
     * @event VttLoader#vttjsloaded
     * @type {EventTarget~Event}
     */
    this.trigger('vttjsloaded');
    /**
     * Fired when vtt.js is loaded.
     *
     * @event Tech#vttjsloaded
     * @type {EventTarget~Event}
     */
    this.player_.tech_.trigger('vttjsloaded');
    vttjsLoaded = true;
  }

  triggerError() {
    /**
     * Fired when vtt.js was not loaded due to an error
     *
     * @event VttLoader#vttjserror
     * @type {EventTarget~Event}
     */
    this.trigger('vttjserror');
    /**
     * Fired when vtt.js was not loaded due to an error
     *
     * @event Tech#vttjserror
     * @type {EventTarget~Event}
     */
    this.player_.tech_.trigger('vttjserror');
    vttjsLoaded = false;
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

export const getVttjs = () => VttLoader.vttjs;

Component.registerComponent('VttLoader', VttLoader);
export default VttLoader;
