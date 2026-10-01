import {
  INSTALLATION_EXTENSIONS,
  installationFeaturesFor,
  type InstallationFeature,
  skinToFlag,
  sourceFrameworkFor,
  type InstallationFramework,
} from '@videojs/installation';
import clsx from 'clsx';
import { Fragment, useRef, type ClipboardEvent, type ReactNode } from 'react';

import Undo from '@/assets/icons/undo.svg?react';
import { OverflowToggle, useOverflowCollapse } from '@/components/OverflowCollapse';
import {
  promptExample,
  promptFeatures,
  promptGoal,
  promptRequest,
  resetAgentPrompt,
  skillAgent,
} from '@/stores/agentPrompt';
import { updateInstallationSelection } from '@/stores/installation';
import {
  AGENT_PROMPT_REQUEST_EXAMPLES,
  AGENT_PROMPT_STEP_SEPARATOR,
  agentPromptAnalytics,
  agentPromptDefaultPicks,
  agentPromptExampleFits,
  agentPromptExamplePicks,
  agentPromptExampleSummary,
  agentPromptMarkdown,
  agentPromptMediaChoices,
  agentPromptMuxHint,
  agentPromptPlayerPicks,
  agentPromptPlayerPicksEqual,
  agentPromptSelection,
  agentPromptSkinChoices,
  agentPromptTarget,
  agentPromptText,
  agentPromptView,
  defaultAgentPromptGoal,
  type AgentPromptGoal,
  type AgentPromptRequestExample,
} from '@/utils/installation/agent-prompt';
import type { InstallationRouteSegment } from '@/utils/installation/routes';
import { useHydratedStore } from '@/utils/useHydratedStore';

import PromptActions from './PromptActions';
import PromptCommandBlock, { CopiedBacktick } from './PromptCommandBlock';
import PromptIntent from './PromptIntent';
import { useRegistryFramework } from './useRegistryFramework';
import { useInstallationSelection } from './useSelection';
import { withSelectionMarker } from './withSelectionMarker';

/**
 * Copy a text selection the way the copy button does. The prompt's text content is the copied text, including the
 * spaces between its blocks and the hidden backticks and periods around its commands, which a browser's own copy leaves
 * out.
 */
function copyPromptSelection(event: ClipboardEvent<HTMLElement>): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

  event.clipboardData.setData('text/plain', selection.getRangeAt(0).cloneContents().textContent ?? '');
  event.preventDefault();
}

// A URL ends before closing punctuation, so a sentence's period or a parenthesis around the link stays outside it.
const URL_PATTERN = /(https:\/\/[^\s()]*[^\s().,;:!?])/;

/** Prose text with its URLs as links. */
function Linked({ text }: { text: string }) {
  return text.split(URL_PATTERN).map((piece, index) =>
    index % 2 === 1 ? (
      <a
        key={index}
        href={piece}
        className="decoration-manila-light/40 intent:decoration-gold wrap-anywhere underline underline-offset-2"
      >
        {piece}
      </a>
    ) : (
      piece
    )
  );
}

/**
 * Prompt prose whose backticks mark inline code. Only matched pairs become code: a reader's request can hold a lone
 * backtick, which stays literal so the page copies the same text as the copy button.
 */
function Prose({ text }: { text: string }) {
  const parts = text.split('`');
  const last = parts.length - 1;
  const unmatched = last % 2 === 1;

  return parts.map((part, index) =>
    index % 2 === 1 && !(unmatched && index === last) ? (
      <code
        key={index}
        className="corner-squircle bg-manila-light/10 text-code rounded box-decoration-clone px-1 py-px font-mono wrap-anywhere"
      >
        <CopiedBacktick />
        {part}
        <CopiedBacktick />
      </code>
    ) : (
      <Linked key={index} text={unmatched && index === last ? `\`${part}` : part} />
    )
  );
}

/** Text only the copied prompt has, such as the period that closes a command where the page shows it on its own. */
function Copied({ text }: { text: string }) {
  return <span hidden>{text}</span>;
}

/** One numbered step. The number is text rather than a list marker, so a copied selection keeps it. */
function PromptStep({ number, children }: { number: number; children: ReactNode }) {
  return (
    <div className="grid gap-x-3" style={{ gridTemplateColumns: 'auto minmax(0, 1fr)' }}>
      <span className="text-manila-light/60 font-semibold tabular-nums">{number}.</span>{' '}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

const NO_FEATURES: readonly InstallationFeature[] = [];

/** The collapsed prompt's height, a preview of its first step, and how far past it the prompt still shows in full. */
const COLLAPSED_HEIGHT = 140;
const COLLAPSE_SLACK = 96;

interface Props {
  /** The installation guide showing the prompt, or `null` on another page, such as Build with AI. */
  route: InstallationRouteSegment | null;
  /** The guide's framework, or the docs framework on another page. */
  framework: InstallationFramework;
  /** What the prompt asks for until the reader picks a goal, such as the migration a migration guide covers. */
  goal?: AgentPromptGoal;
}

/**
 * The AI Quickstart prompt, built from a few questions in the reader's words: the goal, what they are building, the
 * features, their media, the skin, and their coding agent. The commands it shows are the result, stating only what
 * those answers decide and leaving the rest to what `agents init` detects and guides. The media and skin share the
 * installation stores with the guide's own pickers, and a suggested request sets up the player it describes.
 */
function AgentPrompt({ route, framework: pageFramework, goal: pageGoal = defaultAgentPromptGoal(route) }: Props) {
  const picks = useInstallationSelection();
  const registryFramework = useRegistryFramework(sourceFrameworkFor(pageFramework));
  const agent = useHydratedStore(skillAgent, null);
  const goal = useHydratedStore(promptGoal, null) ?? pageGoal;
  const features = useHydratedStore(promptFeatures, NO_FEATURES);
  const request = useHydratedStore(promptRequest, '');
  const picked = useHydratedStore(promptExample, null);
  const cardRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);

  const target = agentPromptTarget(route, route === 'shadcn' ? registryFramework : pageFramework);
  const selection = agentPromptSelection(target, picks, { goal, features });
  const view = agentPromptView(selection, { agent }, { goal, request, features });
  const text = agentPromptMarkdown(view);
  const { overflows, expanded, collapsed, expand, collapse } = useOverflowCollapse(promptRef, {
    maxHeight: COLLAPSED_HEIGHT,
    slack: COLLAPSE_SLACK,
    content: text,
  });

  // Reset returns the answers and the player picks, the only guide choices the prompt shows.
  const defaultPlayerPicks = agentPromptPlayerPicks(agentPromptDefaultPicks(route, target.framework));
  const defaultText = agentPromptText(
    agentPromptSelection(target, { ...picks, ...defaultPlayerPicks }, { goal: pageGoal, features: [] }),
    { agent },
    { goal: pageGoal, request: '', features: [] }
  );

  const examples = AGENT_PROMPT_REQUEST_EXAMPLES.map((group) => ({
    ...group,
    items: group.items.filter((example) => agentPromptExampleFits(example, target.method)),
  }));

  // A picked example's setup line stays until the reader changes what it set.
  const applied =
    picked &&
    agentPromptPlayerPicksEqual(picked.applied, picks) &&
    features.join() === (picked.example.features ?? []).join()
      ? picked
      : null;

  // An example sets up its player, so the command, the features, and the guide's own pickers follow it.
  const pickExample = (example: AgentPromptRequestExample) => {
    const next = agentPromptExamplePicks(example, picks);

    promptExample.set({ example, applied: next });
    updateInstallationSelection(next);
    promptFeatures.set(example.features ?? []);
  };

  // A suggestion that sets a generic stream can move it to Mux, keeping its setup line.
  const hostExampleOnMux =
    applied && (applied.applied.media === 'hls' || applied.applied.media === 'dash')
      ? () => {
          const next = agentPromptExamplePicks({ ...applied.example, media: 'mux-video' }, picks);

          promptExample.set({ ...applied, applied: next });
          updateInstallationSelection(next);
        }
      : null;

  const reset = () => {
    resetAgentPrompt();
    updateInstallationSelection(defaultPlayerPicks);
  };

  return (
    <div
      className="corner-squircle border-line bg-surface @container mx-auto my-6 max-w-3xl overflow-hidden rounded-xl border shadow-xs"
      data-agent-prompt-card
      data-ph-capture-attribute-location="agent-prompt"
      ref={cardRef}
    >
      <PromptIntent
        media={selection.media}
        migrating={selection.from !== null}
        sourceUrl={selection.sourceUrl ?? ''}
        supportedRenderers={agentPromptMediaChoices(selection)}
        // Another kind of media can't play the reader's URL, so switching to one goes back to its demo.
        onMediaChange={(next) =>
          updateInstallationSelection(next === picks.media ? { media: next } : { media: next, sourceUrl: '' })
        }
        skin={selection.useCase === 'background-video' ? null : skinToFlag(selection.skin)}
        includeNoSkin={agentPromptSkinChoices(selection).includes('none')}
        agent={agent}
        onAgentChange={(next) => skillAgent.set(next)}
        goal={goal}
        onGoalChange={(next) => promptGoal.set(next)}
        request={request}
        onRequestChange={(next) => promptRequest.set(next)}
        examples={examples}
        onExamplePick={pickExample}
        pickedExample={
          applied && {
            label: applied.example.label,
            summary: agentPromptExampleSummary(applied.example, applied.applied),
          }
        }
        onHostExampleOnMux={hostExampleOnMux}
        features={features}
        availableFeatures={installationFeaturesFor(selection.useCase)}
        onFeaturesChange={(next) => promptFeatures.set(next)}
        analytics={agentPromptAnalytics(selection)}
        onAnalyticsChange={(on) =>
          updateInstallationSelection({
            extensions: INSTALLATION_EXTENSIONS.filter((extension) =>
              extension === 'mux-data' ? on : picks.extensions.includes(extension)
            ),
          })
        }
        muxHint={agentPromptMuxHint(selection, features)}
      />
      {/* The prompt is dark in both color schemes, so it takes the dark theme tokens. */}
      <div className="dark bg-soot text-manila-light relative">
        <p className="text-p4 text-manila-light/60 px-4 pt-4 font-semibold select-none sm:px-6 sm:pt-5">Your prompt</p>
        {/*
          The prompt's text content is the copied Markdown: hidden text adds the line breaks and list markers the page
          draws with layout instead.
        */}
        <div
          ref={promptRef}
          className={clsx(
            'text-p3 flex flex-col gap-5 px-4 pt-3 pb-4 font-sans leading-relaxed sm:px-6 sm:pb-6',
            collapsed && 'overflow-y-hidden'
          )}
          style={collapsed ? { maxHeight: COLLAPSED_HEIGHT } : undefined}
          data-agent-prompt
          onCopy={copyPromptSelection}
        >
          {view.steps.map(({ heading, command, prose }, index) => (
            <Fragment key={index}>
              {index > 0 && <Copied text={AGENT_PROMPT_STEP_SEPARATOR} />}
              <PromptStep number={index + 1}>
                <p>{heading}</p> <PromptCommandBlock command={command.command} options={command.options} />
                <Copied text="." />{' '}
                <p>
                  <Prose text={prose} />
                </p>
              </PromptStep>
            </Fragment>
          ))}
        </div>
        {/* Outside the prompt, so its text content stays the copied text. */}
        {collapsed && (
          <div className="from-soot pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-end justify-center bg-linear-to-t to-transparent pb-3">
            <OverflowToggle expanded={false} tone="dark" onClick={expand} className="pointer-events-auto" />
          </div>
        )}
        {overflows && expanded && (
          <div className="border-manila-light/10 flex justify-center border-t py-3">
            <OverflowToggle expanded tone="dark" onClick={() => collapse(cardRef.current)} />
          </div>
        )}
      </div>
      <div className="border-line bg-surface-raised flex items-center justify-end gap-2 border-t p-3">
        {text !== defaultText && (
          <button
            type="button"
            onClick={reset}
            className="corner-squircle text-p3 intent:bg-hover focus-visible:outline-gold me-auto inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-1"
          >
            <Undo className="size-4" aria-hidden="true" />
            Reset
          </button>
        )}
        <PromptActions text={text} />
      </div>
    </div>
  );
}

export default withSelectionMarker(AgentPrompt);
