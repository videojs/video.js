import type { Ref } from 'react';

import type { AgentPromptMuxHint } from '@/utils/installation/agent-prompt';

import { INLINE_BUTTON_CLASS } from './promptPresentation';

const MUX_LIVE_DOCS_URL = 'https://www.mux.com/docs/guides/start-live-streaming';

interface Props {
  hint: AgentPromptMuxHint;
  /** What the demo is, such as `video`, for the line that offers replacing it. */
  mediaType: string;
  /** Open the upload dialog. */
  onUpload: () => void;
  /** The upload button, which the dialog returns focus to. */
  uploadRef: Ref<HTMLButtonElement>;
}

/**
 * One line that says why Mux would help the reader's picks and offers the step that gets it: an upload for an adaptive
 * stream, a storyboard, or their own media in place of the demo, or Mux's live guide for an ingest point.
 */
export default function PromptMuxHint({ hint, mediaType, onUpload, uploadRef }: Props) {
  const upload = (label: string) => (
    <button ref={uploadRef} type="button" onClick={onUpload} className={INLINE_BUTTON_CLASS}>
      {label}
    </button>
  );

  return (
    <p className="text-p4">
      {hint === 'live' ? (
        <>
          Live streams need somewhere to send them.{' '}
          <a href={MUX_LIVE_DOCS_URL} target="_blank" rel="noopener noreferrer" className={INLINE_BUTTON_CLASS}>
            Start a live stream on Mux
          </a>{' '}
          to get a stream key and a playback URL.
        </>
      ) : hint === 'quality' ? (
        <>Quality menus need an adaptive stream. {upload('Upload to Mux')} to get one from any video.</>
      ) : hint === 'thumbnails' ? (
        <>Thumbnail previews need a storyboard. {upload('Upload to Mux')} and it makes one for you.</>
      ) : (
        <>
          Using demo {mediaType}. {upload('Upload your own to Mux')}
        </>
      )}
    </p>
  );
}
