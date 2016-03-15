import {AudioTrackKind} from './track-enums';
import Track from './track';
import merge from '../utils/merge-options';

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
      let settings = merge(options, {
      trackType: 'audio',
      kind: AudioTrackKind[options.kind] || ''
    });
    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    let audioTrack = super(settings);
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
          for (let i = 0; i < audioTrackList.length; i++) {
            let at = audioTrackList[i];
            // another audio track is enabled, disable it
            at.enabled = false;
          }
        }
        enabled = newEnabled;
        this.trigger('enabledchange');
      }
    });

    // if the user sets this track to selected then
    // set selected to that true value otherwise
    // we keep it false
    if (settings.enabled) {
      audioTrack.enabled = settings.enabled;
    }
    audioTrack.loaded_ = true;

    return audioTrack;
  }
}

export default AudioTrack;
