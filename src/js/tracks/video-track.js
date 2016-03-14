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
    // on IE8 this will be a document element
    // for every other browser this will be a normal object
    let videoTrack = super(options);
    let selected = false;

    Object.defineProperty(videoTrack, 'selected', {
      get() { return selected; },
      set(newSelected) {
        // an invalid value
        if(typeof newSelected !== 'boolean' || newSelected === selected) {
          return;
        }
        if(newSelected) {
          let videoTrackList = videoTrack.tech_.videoTracks();
          for(let i = 0; i < videoTrackList.length; i++) {
            let vt = videoTrackList[i];
            // another video track is enabled, disable it
            vt.selected = false;
          }
        }
        selected = newSelected;
        this.trigger('selectedchange');
      }
    });

    videoTrack.selected = options.selected;

    return videoTrack;
  }
}

export default VideoTrack;
