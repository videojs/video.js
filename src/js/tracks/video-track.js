import * as VideoTrackEnums from './video-track-enums';
import Track from './track';
import merge from '../utils/merge-options';

/**
 * A single video text track as defined in:
 * @link https://html.spec.whatwg.org/multipage/embedded-content.html#videotrack
 *
 * interface VideoTrack {
 *   readonly attribute DOMString id;
 *   readonly attribute DOMString kind;
 *   readonly attribute DOMString label;
 *   readonly attribute DOMString language;
 *   attribute boolean selected;
 * };
 *
 * @param {Object=} options Object of option names and values
 * @class VideoTrack
 */
class VideoTrack extends Track {
  constructor(options = {}) {
    let settings = merge(options, {
      trackType: 'video',
      kind: VideoTrackEnums.VideoTrackKind[options.kind] || ''
    });

    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    let videoTrack = super(settings);
    let selected = false;

    Object.defineProperty(videoTrack, 'selected', {
      get() { return selected; },
      set(newSelected) {
        // an invalid value
        if (typeof newSelected !== 'boolean' || newSelected === selected) {
          return;
        }
        if (newSelected) {
          let videoTrackList = videoTrack.tech_.videoTracks();
          for (let i = 0; i < videoTrackList.length; i++) {
            let vt = videoTrackList[i];
            // another video track is enabled, disable it
            vt.selected = false;
          }
        }
        selected = newSelected;
        this.trigger('selectedchange');
      }
    });

    // if the user sets this track to selected then
    // set selected to that true value otherwise
    // we keep it false
    if (settings.selected) {
      videoTrack.selected = settings.selected;
    }

    return videoTrack;
  }
}

export default VideoTrack;
