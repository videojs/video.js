/**
 * @file ra-player.js
 */
import VideoJs from 'video.js';

/**
 * A Custom `RaPlayer` class which mimics the standard HTML5 `RaPlayer` class.
 *
 * @param {number|string|Object|RaPlayer} value
 *        This can be of multiple types:
 *        - number: should be a standard error code
 *        - string: an error message (the code will be 0)
 *        - Object: arbitrary properties
 *        - `RaPlayer` (native): used to populate a video.js `MediaError` object
 *        - `RaPlayer` (video.js): will return itself if it's already a
 *          video.js `RaPlayer` object.
 *
 *
 * @class RaPlayer
 */
function raVideoManager(value) {
  const player = new VideoJs(value);

  player.ready(function() {
    // Set volume
    player.volume(0.5);
  });

  return player;
}

raVideoManager.getVideo = (id) => {
  return new VideoJs().getVideo(id);
};

export default raVideoManager;
