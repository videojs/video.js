import * as VideoTrackEnums from './video-track-enums';
import Track from './track';

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
    options.kind = VideoTrackEnums.VideoTrackKind[options.kind] || '';
    options.trackType = 'video';
    // retval will only be defined on IE8, which is when we need it
    let retval = super(options);
    let videoTrack = this;

    let selected = false;
    Object.defineProperty(videoTrack, 'selected', {
      get() { return selected; },
      set(newSelected) {
        if(typeof newSelected !== 'boolean' || newSelected === selected) {
          return;
        }
        if(newSelected === true) {
          let videoTrackList = videoTrack.tech_.videoTracks();
          for(let i = 0; i < videoTrackList.length; i++) {
            let vt = videoTrackList[i];
            // another vido track is enabled, disable it
            vt.selected = false;
          }
        }
        selected = newSelected;
        this.trigger('selectedchange');
      }
    });

    videoTrack.selected = options.selected;

    return retval;
  }
}

export default VideoTrack;
