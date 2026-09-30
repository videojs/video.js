import { Autocomplete } from '@base-ui/react/autocomplete';
import { Collapsible } from '@base-ui/react/collapsible';
import { Menu } from '@base-ui/react/menu';
import {
  getInstallationPreset,
  SKILL_AGENTS,
  type Renderer,
  type SkillAgent,
  type SkinFlag,
  type UseCase,
} from '@videojs/installation';
import clsx from 'clsx';
import { useId, useRef, useState, type ReactNode } from 'react';

import ArrowRight from '@/assets/icons/arrow-right.svg?react';
import Check from '@/assets/icons/check.svg?react';
import ChevronDown from '@/assets/icons/chevron-down.svg?react';
import ChevronRight from '@/assets/icons/chevron-right.svg?react';
import Film from '@/assets/icons/film.svg?react';
import LinkIcon from '@/assets/icons/link.svg?react';
import Paintbrush from '@/assets/icons/paintbrush.svg?react';
import Puzzle from '@/assets/icons/puzzle.svg?react';
import { MENU_GROUP_LABEL_CLASS, MENU_ITEM_CLASS, MENU_POPUP_CLASS } from '@/components/menuClasses';
import { Select } from '@/components/Select';
import {
  AGENT_PROMPT_FEATURE_DEFINITIONS,
  AGENT_PROMPT_FEATURES,
  AGENT_PROMPT_GOAL_DEFINITIONS,
  AGENT_PROMPT_GOALS,
  AGENT_PROMPT_REQUEST_MAX_LENGTH,
  type AgentPromptFeature,
  type AgentPromptGoal,
  type AgentPromptMuxHint,
  type AgentPromptRequestExample,
  type AgentPromptRequestExampleGroup,
} from '@/utils/installation/agent-prompt';
import { twMerge } from '@/utils/twMerge';

import PromptDialog, { type PromptDialogActions } from './PromptDialog';
import PromptMuxHint from './PromptMuxHint';
import { ANY_AGENT, INLINE_BUTTON_CLASS, mediaLabel, presentSkin, SKILL_AGENT_OPTIONS } from './promptPresentation';

// The uploader and the player preview are heavy and most readers never open their dialogs, so they load on demand.
const loadMediaSourceDialogBody = () => import('./MediaSourceDialogBody');
const loadSkinDialogBody = () => import('./SkinDialogBody');

const GOAL_ICONS = {
  skill: <Puzzle className="size-4" />,
  add: <Film className="size-4" />,
  'migrate-video-js-8': <ArrowRight className="size-4" />,
  'migrate-mux-player': <ArrowRight className="size-4" />,
  'migrate-plyr': <ArrowRight className="size-4" />,
  'migrate-media-chrome': <ArrowRight className="size-4" />,
  'customize-skin': <Paintbrush className="size-4" />,
} satisfies Record<AgentPromptGoal, ReactNode>;

const GOAL_OPTIONS = AGENT_PROMPT_GOALS.map((goal) => ({
  value: goal,
  label: AGENT_PROMPT_GOAL_DEFINITIONS[goal].label,
  icon: GOAL_ICONS[goal],
}));

const CONTROL_CLASS = clsx(
  'h-9 rounded-lg corner-squircle border border-line bg-surface text-p3 shadow-xs',
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold'
);

/** A control that opens a menu or dialog, filling its field. */
const TRIGGER_CLASS = clsx(
  CONTROL_CLASS,
  'inline-flex w-full min-w-0 cursor-pointer items-center gap-2 px-3 select-none intent:border-line-strong data-[popup-open]:border-line-strong'
);

const LABEL_CLASS = 'text-p4 font-semibold select-none';

/** What Mux Data is to a reader: a feature of the player, rather than an extension to install. */
const ANALYTICS_LABEL = 'Viewer analytics';

/**
 * One labelled control. The label is only visible text: each control names itself, as the site's select and a dialog
 * trigger have no way to point at an outside label.
 */
function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={clsx('flex min-w-0 flex-col gap-1.5', className)}>
      <span aria-hidden="true" className={LABEL_CLASS}>
        {label}
      </span>
      {children}
    </div>
  );
}

interface Props {
  /** The reader's media URL, or empty for the demo, and the preset that names the demo. */
  sourceUrl: string;
  useCase: UseCase;
  /** The media the page can play, which a pasted URL may pick from. */
  supportedRenderers: readonly Renderer[];
  /** The look, or `null` for a preset with one purpose-built skin. */
  skin: SkinFlag | null;
  includeNoSkin: boolean;
  agent: SkillAgent | null;
  onAgentChange: (agent: SkillAgent | null) => void;
  goal: AgentPromptGoal;
  onGoalChange: (goal: AgentPromptGoal) => void;
  request: string;
  onRequestChange: (request: string) => void;
  /** Suggestions for the request, each of which sets up its player when picked. */
  examples: readonly AgentPromptRequestExampleGroup[];
  onExamplePick: (example: AgentPromptRequestExample) => void;
  /** The suggestion the reader last picked and what it set up, until they undo it. */
  pickedExample: { label: string; summary: string } | null;
  onUndoExample: () => void;
  /** Move the picked suggestion's stream to Mux, or `null` where it would not help. */
  onHostExampleOnMux: (() => void) | null;
  features: readonly AgentPromptFeature[];
  /** The features the picked preset can use. */
  availableFeatures: readonly AgentPromptFeature[];
  onFeaturesChange: (features: AgentPromptFeature[]) => void;
  /** Whether Mux Data measures viewers, or `null` for media it cannot. */
  analytics: boolean | null;
  onAnalyticsChange: (analytics: boolean) => void;
  /** Why Mux would help the picks, if it would. */
  muxHint: AgentPromptMuxHint | null;
}

/**
 * The questions the prompt is built from, in the reader's words. Every answer has a default that works, so only what
 * they are building shows; the goal, features, media, look, and coding agent wait under More options, whose summary
 * shows their current values. Everything else the CLI detects from the project or guides the agent through. Opened, the
 * options stack on narrow cards, pair up in two columns on wider ones, and take three columns once the card reaches the
 * prose column's full width.
 */
export default function PromptIntent({
  sourceUrl,
  useCase,
  supportedRenderers,
  skin,
  includeNoSkin,
  agent,
  onAgentChange,
  goal,
  onGoalChange,
  request,
  onRequestChange,
  examples,
  onExamplePick,
  pickedExample,
  onUndoExample,
  onHostExampleOnMux,
  features,
  availableFeatures,
  onFeaturesChange,
  analytics,
  onAnalyticsChange,
  muxHint,
}: Props) {
  const requestId = useId();
  const chosen = availableFeatures.filter((feature) => features.includes(feature));
  const { contains } = Autocomplete.useFilter();
  const matches = (example: AgentPromptRequestExample) =>
    [
      example.label,
      example.request,
      ...example.keywords,
      ...(example.features ?? []).map((feature) => AGENT_PROMPT_FEATURE_DEFINITIONS[feature].label),
    ].some((text) => contains(text, request));
  const exampleGroups = examples
    .map((group) => ({
      ...group,
      items: group.items.filter(matches),
    }))
    .filter((group) => group.items.length > 0);
  // Open only while an example matches: an open list hides the rest of the row from assistive technology, which an
  // empty one would do for nothing.
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  // The media dialog also opens from the Mux line, and then returns focus there.
  const mediaDialog = useRef<PromptDialogActions>(null);
  const [mediaOpenedFromHint, setMediaOpenedFromHint] = useState(false);
  const uploadRef = useRef<HTMLButtonElement>(null);
  const featureLabels = [
    ...chosen.map((feature) => AGENT_PROMPT_FEATURE_DEFINITIONS[feature].label),
    ...(analytics ? [ANALYTICS_LABEL] : []),
  ];
  const agentLabel = SKILL_AGENT_OPTIONS.find((option) => option.value === (agent ?? ANY_AGENT))?.label ?? null;
  const summary = [
    AGENT_PROMPT_GOAL_DEFINITIONS[goal].label,
    featureLabels.length > 0 ? `${featureLabels.length} ${featureLabels.length === 1 ? 'feature' : 'features'}` : null,
    mediaLabel(sourceUrl, useCase),
    skin ? `${presentSkin(skin).label} look` : null,
    agentLabel,
  ].filter((part) => part !== null);

  const toggleFeature = (feature: AgentPromptFeature, checked: boolean) =>
    onFeaturesChange(
      AGENT_PROMPT_FEATURES.filter((candidate) => (candidate === feature ? checked : features.includes(candidate)))
    );

  return (
    <div className="border-line bg-surface-raised flex flex-col gap-3 border-b p-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor={requestId} className={LABEL_CLASS}>
          What are you building? <span className="dark:text-muted ms-0.5 font-normal">(optional)</span>
        </label>
        <Autocomplete.Root
          items={examples}
          filteredItems={exampleGroups}
          open={examplesOpen && exampleGroups.length > 0}
          onOpenChange={setExamplesOpen}
          itemToStringValue={(example) => example.request}
          value={request}
          onValueChange={(next, { reason }) => {
            onRequestChange(next);

            const example = examples.flatMap((group) => group.items).find((item) => item.request === next);

            if (reason === 'item-press' && example) onExamplePick(example);
          }}
          openOnInputClick
        >
          <Autocomplete.Input
            id={requestId}
            maxLength={AGENT_PROMPT_REQUEST_MAX_LENGTH}
            placeholder="A course site with captions, a podcast player, a hero video…"
            className={clsx(CONTROL_CLASS, 'placeholder:text-muted h-10 w-full px-3')}
          />
          <Autocomplete.Portal>
            <Autocomplete.Positioner align="start" sideOffset={6} className="z-40 outline-none">
              <Autocomplete.Popup
                className={clsx(MENU_POPUP_CLASS, 'flex flex-col overflow-hidden p-0')}
                style={{ width: 'var(--anchor-width)', maxHeight: 'min(var(--available-height), 24rem)' }}
              >
                {/* Examples fill the field and set up their player. Typing narrows them by the words each one matches. */}
                <Autocomplete.List className="scrollbar-thin-visible min-h-0 flex-1 overflow-y-auto p-1">
                  {(group: AgentPromptRequestExampleGroup) => (
                    <Autocomplete.Group key={group.label} items={group.items}>
                      <Autocomplete.GroupLabel
                        className={twMerge(MENU_GROUP_LABEL_CLASS, 'bg-surface-raised dark:bg-soot sticky -top-1 z-10')}
                      >
                        {group.label}
                      </Autocomplete.GroupLabel>
                      <Autocomplete.Collection>
                        {(example: AgentPromptRequestExample) => (
                          <Autocomplete.Item
                            key={example.label}
                            value={example}
                            className={twMerge(MENU_ITEM_CLASS, 'flex-col items-start gap-0')}
                          >
                            <span className="font-semibold">{example.label}</span>
                            <span className="text-p4 dark:text-muted">{example.request}</span>
                          </Autocomplete.Item>
                        )}
                      </Autocomplete.Collection>
                    </Autocomplete.Group>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
        {pickedExample && (
          <p className="text-p4 flex flex-wrap items-baseline gap-x-2">
            <span>
              Set up for <span className="font-semibold">{pickedExample.label}</span>: {pickedExample.summary}.
            </span>
            <button
              type="button"
              aria-label={`Undo ${pickedExample.label}`}
              onClick={onUndoExample}
              className={INLINE_BUTTON_CLASS}
            >
              Undo
            </button>
            {onHostExampleOnMux && (
              <button type="button" onClick={onHostExampleOnMux} className={INLINE_BUTTON_CLASS}>
                Host on Mux instead
              </button>
            )}
          </p>
        )}
        {muxHint && (
          <PromptMuxHint
            hint={muxHint}
            mediaType={getInstallationPreset(useCase).mediaType}
            uploadRef={uploadRef}
            onUpload={() => {
              setMediaOpenedFromHint(true);
              mediaDialog.current?.open();
            }}
          />
        )}
        <span aria-live="polite" className="sr-only">
          {pickedExample ? `Set up for ${pickedExample.label}: ${pickedExample.summary}.` : ''}
        </span>
      </div>
      <Collapsible.Root open={optionsOpen} onOpenChange={setOptionsOpen}>
        <Collapsible.Trigger className="group text-p4 focus-visible:outline-gold -mx-1 flex max-w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 select-none focus-visible:outline-2 focus-visible:outline-offset-1">
          <ChevronRight
            className="text-muted size-4 shrink-0 transition-transform duration-150 group-data-[panel-open]:rotate-90 motion-reduce:transition-none"
            aria-hidden="true"
          />
          <span className="shrink-0 font-semibold">
            More options<span className="group-data-[panel-open]:hidden">:</span>
          </span>{' '}
          {/* The current values, so the reader sees the prompt is complete without opening the options. */}
          <span aria-hidden="true" className="dark:text-muted min-w-0 truncate group-data-[panel-open]:hidden">
            {summary.join(' · ')}
          </span>
          <span className="sr-only group-data-[panel-open]:hidden">{summary.join(', ')}</span>
        </Collapsible.Trigger>
        {/* Kept mounted while closed, so an upload started from the media dialog keeps going. */}
        <Collapsible.Panel keepMounted>
          <div className="@prose:grid-cols-3 grid grid-cols-1 gap-3 pt-3 @xl:grid-cols-2">
            <Field label="Goal">
              <Select
                aria-label="Goal"
                className="w-full"
                value={goal}
                options={GOAL_OPTIONS}
                onChange={(next) => {
                  if (next) onGoalChange(next);
                }}
              />
            </Field>
            {(availableFeatures.length > 0 || analytics !== null) && (
              <Field label="Features">
                <Menu.Root modal={false}>
                  <Menu.Trigger aria-label="Features" className={TRIGGER_CLASS}>
                    <span className="min-w-0 flex-1 truncate text-left">
                      {featureLabels.length > 0 ? featureLabels.join(', ') : 'None'}
                    </span>
                    <ChevronDown className="text-muted size-4 shrink-0" aria-hidden="true" />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner side="bottom" align="start" sideOffset={6} className="z-40 outline-none">
                      <Menu.Popup className={clsx(MENU_POPUP_CLASS, 'min-w-56')}>
                        <Menu.Group>
                          <Menu.GroupLabel className={MENU_GROUP_LABEL_CLASS}>Include in the player</Menu.GroupLabel>
                          {availableFeatures.map((feature) => (
                            <Menu.CheckboxItem
                              key={feature}
                              checked={features.includes(feature)}
                              onCheckedChange={(checked) => toggleFeature(feature, checked)}
                              className={twMerge(MENU_ITEM_CLASS, 'relative pr-8')}
                            >
                              {AGENT_PROMPT_FEATURE_DEFINITIONS[feature].label}
                              <Menu.CheckboxItemIndicator className="absolute right-2 inline-flex items-center">
                                <Check className="size-4" />
                              </Menu.CheckboxItemIndicator>
                            </Menu.CheckboxItem>
                          ))}
                        </Menu.Group>
                        {analytics !== null && (
                          <Menu.Group>
                            <Menu.GroupLabel className={MENU_GROUP_LABEL_CLASS}>Measure</Menu.GroupLabel>
                            <Menu.CheckboxItem
                              checked={analytics}
                              onCheckedChange={onAnalyticsChange}
                              className={twMerge(MENU_ITEM_CLASS, 'relative pr-8')}
                            >
                              {ANALYTICS_LABEL} (Mux Data)
                              <Menu.CheckboxItemIndicator className="absolute right-2 inline-flex items-center">
                                <Check className="size-4" />
                              </Menu.CheckboxItemIndicator>
                            </Menu.CheckboxItem>
                          </Menu.Group>
                        )}
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </Field>
            )}
            <Field
              label="Media"
              className={clsx('@prose:order-2', skin ? '@prose:col-span-2' : '@xl:col-span-2 @prose:col-span-3')}
            >
              <PromptDialog
                name="Media"
                value={{ label: mediaLabel(sourceUrl, useCase), icon: <LinkIcon className="size-4" /> }}
                className={TRIGGER_CLASS}
                title="Choose your media"
                description="Paste a media URL or upload a video to Mux. Without one, the agent uses the demo media."
                focusSelector='input[type="url"]'
                loadBody={loadMediaSourceDialogBody}
                bodyProps={{ supportedRenderers }}
                keepMounted
                actionsRef={mediaDialog}
                onOpenChange={(open) => {
                  if (!open) setMediaOpenedFromHint(false);
                }}
                finalFocus={mediaOpenedFromHint ? uploadRef : undefined}
              />
            </Field>
            {skin && (
              <Field label="Look" className="@prose:order-3">
                <PromptDialog
                  name="Look"
                  value={presentSkin(skin)}
                  className={TRIGGER_CLASS}
                  title="Choose the look"
                  description="Pick how your player looks. The preview plays your media with the selected skin."
                  focusSelector='[role="radio"][aria-checked="true"]'
                  size="lg"
                  loadBody={loadSkinDialogBody}
                  bodyProps={{ includeNoSkin }}
                />
              </Field>
            )}
            <Field label="Agent" className="@prose:order-1 @prose:col-span-1 @xl:col-span-2">
              <Select
                aria-label="Agent"
                className="w-full"
                value={agent ?? ANY_AGENT}
                options={SKILL_AGENT_OPTIONS}
                onChange={(next) => onAgentChange(SKILL_AGENTS.find((candidate) => candidate === next) ?? null)}
              />
            </Field>
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
    </div>
  );
}
