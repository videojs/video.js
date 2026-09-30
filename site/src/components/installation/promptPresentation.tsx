import {
  getInstallationPreset,
  SKILL_AGENTS,
  type SkillAgent,
  type SkinFlag,
  type UseCase,
} from '@videojs/installation';
import type { ReactNode } from 'react';

import Terminal from '@/assets/icons/terminal.svg?react';
import Wand from '@/assets/icons/wand.svg?react';
import ClaudeLogo from '@/assets/logos/brands/claude.svg?react';
import CursorLogo from '@/assets/logos/brands/cursor.svg?react';
import OpenAiLogo from '@/assets/logos/brands/openai.svg?react';
import VsCodeLogo from '@/assets/logos/brands/vscode.svg?react';

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

/** How the look control names a skin. */
export function presentSkin(skin: SkinFlag): PromptOption {
  return { label: SKIN_LABELS[skin], icon: <SkinIcon skin={skin} className={ICON_CLASS} /> };
}

/** How the media control names the reader's media URL, or the demo standing in for it. */
export function mediaLabel(sourceUrl: string, useCase: UseCase): string {
  return sourceUrl ? sourceUrl.replace(/^https?:\/\//, '') : `Demo ${getInstallationPreset(useCase).mediaType}`;
}
