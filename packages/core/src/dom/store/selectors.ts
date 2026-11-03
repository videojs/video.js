import { createSelector } from '@videojs/store';

import { audioTrackFeature } from '../../core/store/features/audio-track';
import { bufferFeature } from '../../core/store/features/buffer';
import { errorFeature } from '../../core/store/features/error';
import { liveFeature } from '../../core/store/features/live';
import { metadataFeature } from '../../core/store/features/metadata';
import { playbackFeature } from '../../core/store/features/playback';
import { playbackRateFeature } from '../../core/store/features/playback-rate';
import { qualityFeature } from '../../core/store/features/quality';
import { sourceFeature } from '../../core/store/features/source';
import { streamTypeFeature } from '../../core/store/features/stream-type';
import { timeFeature } from '../../core/store/features/time';
import { controlsFeature } from './features/controls';
import { fullscreenFeature } from './features/fullscreen';
import { pipFeature } from './features/pip';
import { remotePlaybackFeature } from './features/remote-playback';
import { textTrackFeature } from './features/text-track';
import { volumeFeature } from './features/volume';

/** Select the audio track state (audioTrackList, selectAudioTrack). */
export const selectAudioTrack = createSelector(audioTrackFeature);
/** Select the buffer state (buffered, seekable). */
export const selectBuffer = createSelector(bufferFeature);
/** Select the controls state (controlsVisible, userActive, toggleControls, requestControlsLock). */
export const selectControls = createSelector(controlsFeature);
/** Select the error state (error, dismissError). */
export const selectError = createSelector(errorFeature);
/** Select the fullscreen state (isFullscreen, fullscreenAvailability, requestFullscreen, exitFullscreen). */
export const selectFullscreen = createSelector(fullscreenFeature);
/** Select the live state (`liveEdgeStart`, `targetLiveWindow`). */
export const selectLive = createSelector(liveFeature);
/** Select resolved content metadata (title, poster). */
export const selectMetadata = createSelector(metadataFeature);
/**
 * Select the PiP state (isPictureInPicture, pictureInPictureAvailability, requestPictureInPicture,
 * exitPictureInPicture).
 */
export const selectPiP = createSelector(pipFeature);
/** Select the playback state (paused, ended, play, pause). */
export const selectPlayback = createSelector(playbackFeature);
/** Select the playback rate state (playbackRate, playbackRates, setPlaybackRate). */
export const selectPlaybackRate = createSelector(playbackRateFeature);
/** Select the quality state (videoRenditionList, activeVideoRendition, selectVideoRendition). */
export const selectQuality = createSelector(qualityFeature);
/** Select the remote playback state (remotePlaybackState, remotePlaybackAvailability, promptRemotePlayback). */
export const selectRemotePlayback = createSelector(remotePlaybackFeature);
/** Select the source state (currentSrc, canPlay). */
export const selectSource = createSelector(sourceFeature);
/** Select the stream type state (`streamType`: `'on-demand' | 'live' | 'unknown'`). */
export const selectStreamType = createSelector(streamTypeFeature);
/**
 * Select the text track state (textTrackList, subtitlesShowing, toggleSubtitles, selectSubtitlesTrack, chaptersCues,
 * thumbnailsTrack).
 */
export const selectTextTrack = createSelector(textTrackFeature);
/** Select the time state (currentTime, duration, seek). */
export const selectTime = createSelector(timeFeature);
/** Select the volume state (volume, muted, setVolume, setMuted). */
export const selectVolume = createSelector(volumeFeature);
