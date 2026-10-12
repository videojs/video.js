import type { AgentPromptHostingHint } from '@/utils/installation/agent-prompt';

import { INLINE_BUTTON_CLASS } from './promptPresentation';

const HINTS = {
  live: { need: 'Live streams need somewhere to send them.', gain: 'that takes live streams' },
  quality: { need: 'Quality menus need an adaptive stream.', gain: 'that makes one from any video' },
  thumbnails: { need: 'Thumbnail previews need a storyboard.', gain: 'that makes one for you' },
} as const satisfies Record<AgentPromptHostingHint, { need: string; gain: string }>;

interface Props {
  hint: AgentPromptHostingHint;
  /** The video hosting guide for the reader's framework. */
  href: string;
}

/** One line that says why the picks need more than a plain file, and points at the guide to video hosting. */
export default function PromptHostingHint({ hint, href }: Props) {
  const { need, gain } = HINTS[hint];

  return (
    <p className="text-p4" data-ph-capture-attribute-location="agent-prompt-hosting-hint">
      {need}{' '}
      <a href={href} className={INLINE_BUTTON_CLASS} data-ph-capture-attribute-cta={`hosting-${hint}`}>
        Choose video hosting
      </a>{' '}
      {gain}.
    </p>
  );
}
