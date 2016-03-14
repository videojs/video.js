import * as AudioTrackEnums from './audio-track-enums';
import Track from './track';

/**
 * A single audio text track as defined in:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#audiotrack
 *
 * interface AudioTrack {
 *   readonly attribute DOMString id;
 *   readonly attribute DOMString kind;
 *   readonly attribute DOMString label;
 *   readonly attribute DOMString language;
 *   attribute boolean enabled;
 * };
 *
 * @param {Object=} options Object of option names and values
 * @class AudioTrack
 */
class AudioTrack extends Track {
  constructor(options = {}) {
    options.trackType = 'audio';
    options.kind = AudioTrackEnums.AudioTrackKind[options.kind] || '';
    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    let audioTrack = super(options);
    let enabled = false;

    Object.defineProperty(audioTrack, 'enabled', {
      get() { return enabled; },
      set(newEnabled) {
        // an invalid value
        if (typeof newEnabled !== 'boolean' || newEnabled === enabled) {
          return;
        }

        // We diverge from the spec here because we can only
        // support one audio track at a time. So we
        // make sure to disable any other audio track
        // before we enable this one
        if (newEnabled) {
          let audioTrackList = audioTrack.tech_.audioTracks();
          for(let i = 0; i < audioTrackList.length; i++) {
            let at = audioTrackList[i];
            // another audio track is enabled, disable it
            at.enabled = false;
          }
        }
        enabled = newEnabled;
        this.trigger('enabledchange');
      }
    });

    options.enabled = options.enabled || false;
    // we call this after defining the setter so we can use the setter
    audioTrack.enabled = options.enabled;
    audioTrack.loaded_ = true;

    return audioTrack;
  }
}

export default AudioTrack;
