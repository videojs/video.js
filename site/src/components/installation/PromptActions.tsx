import { Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { useRef, useState, type ReactNode } from 'react';

import Check from '@/assets/icons/check.svg?react';
import ChevronDown from '@/assets/icons/chevron-down.svg?react';
import Copy from '@/assets/icons/copy.svg?react';
import ClaudeLogo from '@/assets/logos/brands/claude.svg?react';
import CursorLogo from '@/assets/logos/brands/cursor.svg?react';
import OpenAiLogo from '@/assets/logos/brands/openai.svg?react';
import {
  MENU_GROUP_LABEL_CLASS,
  MENU_ITEM_CLASS,
  MENU_POPUP_CLASS,
  MENU_SEPARATOR_CLASS,
} from '@/components/menuClasses';
import { agentPromptOpenUrl, agentPromptShellCommand, type AgentPromptCli } from '@/utils/installation/agent-prompt';
import useIsHydrated from '@/utils/useIsHydrated';

type CopyTarget = 'prompt' | AgentPromptCli;

/** What each copy puts on the clipboard, as the live region names it. */
const COPY_TARGET_NAMES = {
  prompt: 'the prompt',
  'claude-code': 'the Claude Code command',
  codex: 'the Codex command',
  cursor: 'the Cursor CLI command',
} as const satisfies Record<CopyTarget, string>;

/** How long a copy's outcome shows before the controls return to their labels. */
const COPY_STATUS_DURATION = 2000;

type OpenApp = Parameters<typeof agentPromptOpenUrl>[0];

const TERMINAL_COPIES: readonly { cli: AgentPromptCli; label: string; icon: ReactNode }[] = [
  { cli: 'claude-code', label: 'Copy for Claude Code', icon: <ClaudeLogo className="size-4" /> },
  { cli: 'codex', label: 'Copy for Codex', icon: <OpenAiLogo className="size-4" /> },
  { cli: 'cursor', label: 'Copy for Cursor', icon: <CursorLogo className="size-4" /> },
];

const OPEN_LINKS: readonly { app: OpenApp; label: string; icon: ReactNode }[] = [
  { app: 'cursor', label: 'Open in Cursor', icon: <CursorLogo className="size-4" /> },
  { app: 'claude', label: 'Open in Claude', icon: <ClaudeLogo className="size-4" /> },
  { app: 'chatgpt', label: 'Open in ChatGPT', icon: <OpenAiLogo className="size-4" /> },
];

const segmentClass = clsx(
  'inline-flex h-9 items-center border border-line bg-surface text-p3 font-semibold whitespace-nowrap shadow-xs select-none',
  // Hover rather than `intent:`: a click leaves focus here, and a focus highlight would linger after copying.
  'hover:border-line-strong hover:bg-hover',
  'focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold',
  'disabled:cursor-wait'
);

function ItemIcon({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center">
      {children}
    </span>
  );
}

interface Props {
  /** The prompt as copied. */
  text: string;
}

/**
 * Copy the prompt, or hand it to a coding agent directly: a terminal command that starts Claude Code, Codex, or Cursor
 * with it, or a link that opens it in Cursor or a chat app.
 */
export default function PromptActions({ text }: Props) {
  // The last copy's outcome. The copy button shows the prompt's, and the menu trigger a terminal command's, since the
  // menu has closed by then.
  const [status, setStatus] = useState<{ target: CopyTarget; copied: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isHydrated = useIsHydrated();

  async function copy(target: CopyTarget, value: string): Promise<void> {
    let copied = true;

    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error('Failed to copy text:', error);
      copied = false;
    }

    setStatus({ target, copied });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(null), COPY_STATUS_DURATION);
  }

  const promptStatus = status?.target === 'prompt' ? status : null;
  const commandCopied = status !== null && status.target !== 'prompt' && status.copied;
  const openUrl = (app: OpenApp) => (isHydrated ? agentPromptOpenUrl(app, text) : '#');

  return (
    <div className="inline-flex shrink-0 items-stretch">
      <button
        type="button"
        disabled={!isHydrated}
        // The live region below announces the copy, so the name stays put for readers returning to the button.
        aria-label="Copy prompt"
        onClick={() => void copy('prompt', text)}
        className={clsx(segmentClass, 'corner-squircle cursor-pointer gap-1.5 rounded-l-lg px-3')}
      >
        {promptStatus?.copied ? (
          <Check className="text-accent size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
        {/* Left-aligned, so the shorter "Copied" sits beside its check within the reserved width. */}
        <span className="grid text-left">
          {/* Reserve the wider label so the button keeps its width between states. */}
          <span className="invisible col-start-1 row-start-1" aria-hidden="true">
            Copy prompt
          </span>
          <span className="col-start-1 row-start-1">
            {promptStatus ? (promptStatus.copied ? 'Copied' : 'Error') : 'Copy prompt'}
          </span>
        </span>
      </button>
      <Menu.Root modal={false}>
        <Menu.Trigger
          disabled={!isHydrated}
          aria-label="More prompt actions"
          className={clsx(
            segmentClass,
            'corner-squircle data-[popup-open]:border-line-strong -ml-px w-9 cursor-pointer justify-center rounded-r-lg'
          )}
        >
          {commandCopied ? (
            <Check className="text-accent size-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" aria-hidden="true" />
          )}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-40 outline-none">
            <Menu.Popup className={clsx(MENU_POPUP_CLASS, 'min-w-64')}>
              <Menu.Group>
                <Menu.GroupLabel className={MENU_GROUP_LABEL_CLASS}>Start in a terminal</Menu.GroupLabel>
                {TERMINAL_COPIES.map(({ cli, label, icon }) => (
                  <Menu.Item
                    key={cli}
                    className={MENU_ITEM_CLASS}
                    onClick={() => void copy(cli, agentPromptShellCommand(cli, text))}
                  >
                    <ItemIcon>{icon}</ItemIcon>
                    {label}
                  </Menu.Item>
                ))}
              </Menu.Group>
              <Menu.Separator className={MENU_SEPARATOR_CLASS} />
              <Menu.Group>
                <Menu.GroupLabel className={MENU_GROUP_LABEL_CLASS}>Open in an app</Menu.GroupLabel>
                {OPEN_LINKS.map(({ app, label, icon }) => (
                  <Menu.LinkItem
                    key={app}
                    className={MENU_ITEM_CLASS}
                    href={openUrl(app)}
                    target="_blank"
                    rel="noopener noreferrer"
                    closeOnClick
                  >
                    <ItemIcon>{icon}</ItemIcon>
                    {label}
                  </Menu.LinkItem>
                ))}
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <span aria-live="polite" className="sr-only">
        {status ? `${status.copied ? 'Copied' : "Couldn't copy"} ${COPY_TARGET_NAMES[status.target]}` : ''}
      </span>
    </div>
  );
}
