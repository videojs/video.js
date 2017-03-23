import AudioTrackList from './audio-track-list';
import VideoTrackList from './video-track-list';
import TextTrackList from './text-track-list';
import HtmlTrackElementList from './html-track-element-list';

import TextTrack from './text-track';
import AudioTrack from './audio-track';
import VideoTrack from './video-track';
import HTMLTrackElement from './html-track-element';

import mergeOptions from '../utils/merge-options';

/*
 * This file contains all track properties that are used in
 * player.js, tech.js, html5.js and possibly other techs in the future.
 */

const NORMAL = {
  audio: {
    ListClass: AudioTrackList,
    TrackClass: AudioTrack,
    capitalName: 'Audio'
  },
  video: {
    ListClass: VideoTrackList,
    TrackClass: VideoTrack,
    capitalName: 'Video'
  },
  text: {
    ListClass: TextTrackList,
    TrackClass: TextTrack,
    capitalName: 'Text'
  }
};

Object.keys(NORMAL).forEach(function(type) {
  NORMAL[type].getterName = `${type}Tracks`;
  NORMAL[type].privateName = `${type}Tracks_`;
});

const REMOTE = {
  remoteText: {
    ListClass: TextTrackList,
    TrackClass: TextTrack,
    capitalName: 'RemoteText',
    getterName: 'remoteTextTracks',
    privateName: 'remoteTextTracks_'
  },
  remoteTextEl: {
    ListClass: HtmlTrackElementList,
    TrackClass: HTMLTrackElement,
    capitalName: 'RemoteTextTrackEls',
    getterName: 'remoteTextTrackEls',
    privateName: 'remoteTextTrackEls_'
  }
};

const ALL = mergeOptions(NORMAL, REMOTE);

REMOTE.names = Object.keys(REMOTE);
NORMAL.names = Object.keys(NORMAL);
ALL.names = [].concat(REMOTE.names).concat(NORMAL.names);

export {
  NORMAL,
  REMOTE,
  ALL
};
