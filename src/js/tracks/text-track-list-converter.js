/**
 * Utilities for capturing text track state and re-creating tracks
 * based on a capture.
 *
 * @file text-track-list-converter.js
 */

/**
 * Examine a single text track and return a JSON-compatible javascript
 * object that represents the text track's state.
 * @param track {TextTrackObject} the text track to query
 * @return {Object} a serializable javascript representation of the
 * @private
 */
let trackToJson_ = function(track) {
  let ret = ['kind', 'label', 'language', 'id',
             'inBandMetadataTrackDispatchType',
             'mode', 'src'].reduce((acc, prop, i) => {
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
 * Examine a tech and return a JSON-compatible javascript array that
 * represents the state of all text tracks currently configured. The
 * return array is compatible with `jsonToTextTracks`.
 * @param tech {tech} the tech object to query
 * @return {Array} a serializable javascript representation of the
 * @function textTracksToJson
 */
let textTracksToJson = function(tech) {
  let trackEls = tech.el().querySelectorAll('track');

  let trackObjs = Array.prototype.map.call(trackEls, (t) => t.track);
  let tracks = Array.prototype.map.call(trackEls, function(trackEl) {
    let json = trackToJson_(trackEl.track);
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
 * Creates a set of remote text tracks on a tech based on an array of
 * javascript text track representations.
 * @param json {Array} an array of text track representation objects,
 * like those that would be produced by `textTracksToJson`
 * @param tech {tech} the tech to create text tracks on
 * @function jsonToTextTracks
 */
let jsonToTextTracks = function(json, tech) {
  json.forEach(function(track) {
    let addedTrack = tech.addRemoteTextTrack(track).track;
    if (!track.src && track.cues) {
      track.cues.forEach((cue) => addedTrack.addCue(cue));
    }
  });

  return tech.textTracks();
};

export default {textTracksToJson, jsonToTextTracks, trackToJson_};
