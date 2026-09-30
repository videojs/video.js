import { SKILL_AGENTS, type SkillAgent } from '@videojs/installation';
import { atom, onMount, type WritableAtom } from 'nanostores';

import { SKILL_AGENT_KEY } from '@/consts';
import { useCase } from '@/stores/installation';
import {
  agentPromptFeaturesFor,
  type AgentPromptFeature,
  type AgentPromptGoal,
  type AgentPromptPlayerPicks,
  type AgentPromptRequestExample,
} from '@/utils/installation/agent-prompt';

// Storage is absent during server rendering; every access goes through this optional handle.
const storage: Storage | undefined = globalThis.localStorage;

/**
 * A choice remembered across visits, or `null` while the reader has not made one. The stored value arrives on first
 * subscription, so server-rendered markup matches the client's first render.
 */
function rememberedAtom<T extends string>(key: string, valid: readonly T[]): WritableAtom<T | null> {
  const store = atom<T | null>(null);

  onMount(store, () => {
    const stored = storage?.getItem(key);

    store.set(valid.find((value) => value === stored) ?? null);

    return store.listen((value) => {
      try {
        if (value === null) storage?.removeItem(key);
        else storage?.setItem(key, value);
      } catch {
        // Storage may be full or disabled; the in-memory value still drives the page.
      }
    });
  });

  return store;
}

/**
 * The coding agent the AI Quickstart prompt installs the Video.js skill for, or `null` to let the agent follow its own
 * steps. Readers use the same agent from visit to visit, so it is remembered.
 */
export const skillAgent = rememberedAtom<SkillAgent>(SKILL_AGENT_KEY, SKILL_AGENTS);

/** What the prompt asks the agent to do, or `null` for the page's default. */
export const promptGoal = atom<AgentPromptGoal | null>(null);

/** Player features the prompt asks for, each pointing the agent at its guide. */
export const promptFeatures = atom<readonly AgentPromptFeature[]>([]);

// A preset change drops the features it cannot use, so they neither linger unseen nor return with another preset.
onMount(promptFeatures, () =>
  useCase.listen((next) => {
    const available = agentPromptFeaturesFor(next);
    const current = promptFeatures.get();

    if (current.some((feature) => !available.includes(feature)))
      promptFeatures.set(current.filter((feature) => available.includes(feature)));
  })
);

/** The reader's own description of what they are building. */
export const promptRequest = atom<string>('');

/**
 * A suggested request the reader picked, with the picks it applied, so a later change of the reader's shows it no
 * longer applies.
 */
interface PickedAgentPromptExample {
  example: AgentPromptRequestExample;
  applied: AgentPromptPlayerPicks;
}

/** The last suggested request the reader picked, or `null` once the prompt is reset. */
export const promptExample = atom<PickedAgentPromptExample | null>(null);

/**
 * Put this visit's answers back to the page's defaults. The coding agent stays: it is a remembered preference, not an
 * answer to this prompt, and its own select changes it.
 */
export function resetAgentPrompt(): void {
  promptGoal.set(null);
  promptFeatures.set([]);
  promptRequest.set('');
  promptExample.set(null);
}
