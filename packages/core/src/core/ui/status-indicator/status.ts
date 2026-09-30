import { DEFAULT_INPUT_INDICATOR_LABELS, type InputIndicatorLabels } from '../indicator/labels';
import type { InputActionEvent, MediaSnapshot } from '../input-action';
import { deriveVolumeStatus } from '../volume-indicator/status';

export type BuiltInIndicatorStatus =
  | 'pause'
  | 'play'
  | 'volume-off'
  | 'volume-low'
  | 'volume-high'
  | 'captions-on'
  | 'captions-off'
  | 'fullscreen'
  | 'exit-fullscreen'
  | 'pip'
  | 'exit-pip';

/** Built-in indicator statuses plus any custom status returned by `deriveCustomStatus`. */
export type IndicatorStatus = BuiltInIndicatorStatus | (string & {});

/** Display details for a status-indicator update. */
export interface StatusDetails<Status extends IndicatorStatus = BuiltInIndicatorStatus> {
  /** Visual status reflected on `data-status`. */
  status: Status;
  /** Label for the predicted status. Built-in statuses use translated labels. */
  label: string;
  /** Shown instead of `label` when not `null`. Built-in statuses use it for the predicted volume percentage. */
  value: string | null;
}

/** Derives the predicted visual status from an input action and its pre-action media snapshot. */
export function deriveStatus(
  event: InputActionEvent,
  snapshot: MediaSnapshot,
  labels: InputIndicatorLabels = DEFAULT_INPUT_INDICATOR_LABELS
): StatusDetails | null {
  switch (event.action) {
    case 'togglePaused': {
      const paused = snapshot.paused !== undefined ? !snapshot.paused : true;

      return {
        status: paused ? 'pause' : 'play',
        label: paused ? labels.paused : labels.playing,
        value: null,
      };
    }
    case 'toggleMuted':
    case 'volumeStep':
      return deriveVolumeStatus(event, snapshot, labels);
    case 'toggleSubtitles': {
      if (snapshot.subtitlesAvailable === false) return null;

      const showing = snapshot.subtitlesShowing !== undefined ? !snapshot.subtitlesShowing : true;

      return {
        status: showing ? 'captions-on' : 'captions-off',
        label: showing ? labels.captionsOn : labels.captionsOff,
        value: null,
      };
    }
    case 'toggleFullscreen': {
      const fullscreen = snapshot.isFullscreen !== undefined ? !snapshot.isFullscreen : true;

      return {
        status: fullscreen ? 'fullscreen' : 'exit-fullscreen',
        label: fullscreen ? labels.fullscreen : labels.exitFullscreen,
        value: null,
      };
    }
    case 'togglePictureInPicture': {
      const pip = snapshot.isPictureInPicture !== undefined ? !snapshot.isPictureInPicture : true;

      return {
        status: pip ? 'pip' : 'exit-pip',
        label: pip ? labels.pictureInPicture : labels.exitPictureInPicture,
        value: null,
      };
    }
    default:
      return null;
  }
}

/** Returns the volume percentage when present, then the translated status label. */
export function getStatusIndicatorDisplayValue(state: { value: string | null; label: string | null }): string {
  return state.value ?? state.label ?? '';
}
