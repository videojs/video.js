import {
  getInstallationRenderer,
  SKILL_AGENTS,
  type Renderer,
  type SkillAgent,
  type SkinFlag,
} from '@videojs/installation';
import type { ReactNode } from 'react';

import Terminal from '@/assets/icons/terminal.svg?react';
import Wand from '@/assets/icons/wand.svg?react';
import ClaudeLogo from '@/assets/logos/brands/claude.svg?react';
import CursorLogo from '@/assets/logos/brands/cursor.svg?react';
import OpenAiLogo from '@/assets/logos/brands/openai.svg?react';
import VsCodeLogo from '@/assets/logos/brands/vscode.svg?react';

import { MEDIA_SOURCE_MARKS, type MediaSourceMark } from './mediaSourceMarks';
import SkinIcon from './SkinIcon';

const ICON_CLASS = 'size-4';

/** A text button or link inside a line of the form, such as Undo. */
export const INLINE_BUTTON_CLASS =
  'decoration-line-strong intent:decoration-current focus-visible:outline-gold cursor-pointer rounded-sm font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-1';

/** A choice as the form shows it. */
export interface PromptOption {
  label: string;
  icon: ReactNode;
}

/** The coding agent select's value for leaving the agent to its own steps. */
export const ANY_AGENT = 'any';

const SKILL_AGENT_PRESENTATIONS = {
  codex: { label: 'Codex', icon: <OpenAiLogo className={ICON_CLASS} /> },
  'claude-code': { label: 'Claude Code', icon: <ClaudeLogo className={ICON_CLASS} /> },
  vscode: { label: 'VS Code', icon: <VsCodeLogo className={ICON_CLASS} /> },
  cursor: { label: 'Cursor', icon: <CursorLogo className={ICON_CLASS} /> },
  other: { label: 'Other agents', icon: <Terminal className={ICON_CLASS} /> },
} satisfies Record<SkillAgent, PromptOption>;

/** The coding agents the skill command can target, after the choice that lists every agent's steps. */
export const SKILL_AGENT_OPTIONS = [
  { value: ANY_AGENT, label: 'Any agent', icon: <Wand className={ICON_CLASS} /> },
  ...SKILL_AGENTS.map((agent) => ({ value: agent, ...SKILL_AGENT_PRESENTATIONS[agent] })),
];

const SKIN_LABELS = { default: 'Default', minimal: 'Minimal', none: 'Build my own' } satisfies Record<SkinFlag, string>;

/** How the skin control names a skin. */
export function presentSkin(skin: SkinFlag): PromptOption {
  return { label: SKIN_LABELS[skin], icon: <SkinIcon skin={skin} className={ICON_CLASS} /> };
}

/** A media source's logo at the form's icon size, or its monogram for a protocol without one, such as HLS. */
export function MediaMark({ renderer }: { renderer: Renderer }) {
  const mark: MediaSourceMark = MEDIA_SOURCE_MARKS[renderer];

  if ('monogram' in mark) {
    // Small enough that the widest monogram, DASH, fits the mark's slot beside the logos.
    return (
      <span className="font-display-compact leading-none font-bold tracking-tight" style={{ fontSize: '0.625rem' }}>
        {mark.monogram}
      </span>
    );
  }

  const Logo = mark.logo;

  return <Logo className={mark.wordmark ? 'h-3 w-auto' : ICON_CLASS} />;
}

/** The slot a media mark sits in, wide enough for a wordmark or monogram so labels line up beside square logos. */
export const MEDIA_MARK_SLOT_CLASS = 'inline-flex h-4 w-7 shrink-0 items-center justify-center';

/** The media menu's groups, as the guide's media picker orders them. */
const MEDIA_GROUPS: readonly { label: string; renderers: readonly Renderer[] }[] = [
  {
    label: 'Files and streams',
    renderers: ['html5-video', 'html5-audio', 'background-video', 'hls', 'hls-background-video', 'dash'],
  },
  { label: 'Hosting', renderers: ['mux-video', 'mux-audio', 'mux-background-video', 'cloudflare'] },
  { label: 'Platforms', renderers: ['youtube', 'vimeo', 'twitch', 'tiktok', 'spotify'] },
];

/** The media the page offers, in the menu's groups, leaving out groups with none. */
export function mediaGroups(renderers: readonly Renderer[]): { label: string; renderers: Renderer[] }[] {
  return MEDIA_GROUPS.map((group) => ({
    label: group.label,
    renderers: group.renderers.filter((renderer) => renderers.includes(renderer)),
  })).filter((group) => group.renderers.length > 0);
}

/** How the form names the media: the reader's URL, or the demo for the picked media. */
export function mediaLabel(renderer: Renderer, sourceUrl: string): string {
  return sourceUrl ? sourceUrl.replace(/^https?:\/\//, '') : `${getInstallationRenderer(renderer).label} demo`;
}
