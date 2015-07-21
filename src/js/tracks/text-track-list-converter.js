let ttToJson = function(track) {
  return {
    kind: track.kind,
    label: track.label,
    language: track.language,
    id: track.id,
    inBandMetadataTrackDispatchType: track.inBandMetadataTrackDispatchType,
    mode: track.mode,
    cues: track.cues && Array.prototype.map.call(track.cues, function(cue) {
      return {
        startTime: cue.startTime,
        endTime: cue.endTime,
        text: cue.text,
        id: cue.id
      };
    }),
    src: track.src
  };
};

let textTracksToJson = function(tech) {
  let trackEls = tech.el().querySelectorAll('track');

  let trackObjs = Array.prototype.map.call(trackEls, (t) => t.track);
  let tracks = Array.prototype.map.call(trackEls, function(trackEl) {
    let json = ttToJson(trackEl.track);
    json.src = trackEl.src;
    return json;
  });

  return tracks.concat(Array.prototype.filter.call(tech.textTracks(), function(track) {
    return trackObjs.indexOf(track) === -1;
  }).map(ttToJson));
};

let jsonToTextTracks = function(json, tech) {
  json.forEach(function(track) {
    let addedTrack = tech.addRemoteTextTrack(track).track;
    if (!track.src) {
      track.cues.forEach((cue) => addedTrack.addCue(cue));
    }
  });

  return tech.textTracks();
};

export default {textTracksToJson, jsonToTextTracks};
