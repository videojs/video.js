import type { Renderer } from '@videojs/installation';
import { useId } from 'react';

import MediaSourceUrlField from './MediaSourceUrlField';
import MuxUploaderPanel from './MuxUploaderPanel';

interface Props {
  supportedRenderers: readonly Renderer[];
}

/** The media URL field and Mux upload from the guide's media section, loaded when the prompt's dialog first opens. */
export default function MediaSourceDialogBody({ supportedRenderers }: Props) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-6">
      <MediaSourceUrlField id={inputId} supportedRenderers={supportedRenderers} choicesLocation="in the prompt" />

      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="bg-line h-px flex-1" />
        <span className="text-muted text-p4 tracking-wide uppercase select-none">or</span>
        <span className="bg-line h-px flex-1" />
      </div>

      <MuxUploaderPanel />
    </div>
  );
}
