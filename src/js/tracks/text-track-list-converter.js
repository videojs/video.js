/**
 * @file text-track-list-converter.js Utilities for capturing text track state and
 * re-creating tracks based on a capture.
 *
 * @module text-track-list-converter
 */

/**
 * Examine a single {@link TextTrack} and return a JSON-compatible javascript object that
 * represents the {@link TextTrack}'s state.
 *
 * @param {TextTrack} track
 *        The text track to query.
 *
 * @return {Object}
 *         A serializable javascript representation of the TextTrack.
 * @private
 */
const trackToJson_ = function(track) {
  const ret = [
    'kind', 'label', 'language', 'id',
    'inBandMetadataTrackDispatchType', 'mode', 'src'
  ].reduce((acc, prop, i) => {

    if (track[prop]) {
      acc[prop] = track[prop];
    }

    return acc;
  }, {
    cues: track.cues && Array.prototype.map.call(track.cues, function(cue) {
      return {
        startTime: cue.startTime,
        endTime: cue.endTime,
        text: cue.text,
        id: cue.id
      };
    })
  });

  return ret;
};

/**
 * Examine a {@link Tech} and return a JSON-compatible javascript array that represents the
 * state of all {@link TextTrack}s currently configured. The return array is compatible with
 * {@link text-track-list-converter:jsonToTextTracks}.
 *
 * @param {Tech} tech
 *        The tech object to query
 *
 * @return {Array}
 *         A serializable javascript representation of the {@link Tech}s
 *         {@link TextTrackList}.
 */
const textTracksToJson = function(tech) {

  const trackEls = tech.$$('track');

  const trackObjs = Array.prototype.map.call(trackEls, (t) => t.track);
  const tracks = Array.prototype.map.call(trackEls, function(trackEl) {
    const json = trackToJson_(trackEl.track);

    if (trackEl.src) {
      json.src = trackEl.src;
    }
    return json;
  });

  return tracks.concat(Array.prototype.filter.call(tech.textTracks(), function(track) {
    return trackObjs.indexOf(track) === -1;
  }).map(trackToJson_));
};

/**
 * Create a set of remote {@link TextTrack}s on a {@link Tech} based on an array of javascript
 * object {@link TextTrack} representations.
 *
 * @param {Array} json
 *        An array of `TextTrack` representation objects, like those that would be
 *        produced by `textTracksToJson`.
 *
 * @param {Tech} tech
 *        The `Tech` to create the `TextTrack`s on.
 */
const jsonToTextTracks = function(json, tech) {
  json.forEach(function(track) {
    const addedTrack = tech.addRemoteTextTrack(track).track;

    if (!track.src && track.cues) {
      track.cues.forEach((cue) => addedTrack.addCue(cue));
    }
  });

  return tech.textTracks();
};

export default {textTracksToJson, jsonToTextTracks, trackToJson_};
