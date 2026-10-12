import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { compareVersions } from './registry/proxy.ts';
import type { Fixture, Task, TaskExpectation } from './tasks.ts';

/**
 * How each trial words its request, holding the task constant:
 *
 * - `baseline` sends the prompt as written, which says "Video.js" the way people ask, so installing Video.js 8 stays a
 *   possible mistake.
 * - `v10` names the major version, to measure the install itself.
 * - `skill` installs the videojs skill.
 * - `builder` appends what a quickstart prompt builder would hand the agent: Video.js 10 and a pinned `agents init`
 *   command with every choice filled in.
 * - `cli` appends only a pointer to `agents init`, without flags.
 * - `interactive` sends the prompt as written and has a simulated user answer the agent's questions from the task's
 *   answer card, in place of the single "go ahead" follow-up.
 */
export const ARMS = ['baseline', 'skill', 'v10', 'builder', 'cli', 'interactive'] as const;
export type Arm = (typeof ARMS)[number];

const UNVERSIONED = /\bVideo\.js\b(?!\s*\d)/g;

/** Whether an arm has anything to test on a task. */
export function armApplies(task: Pick<Task, 'prompts' | 'suite' | 'expect' | 'arms'>, arm: Arm): boolean {
  if (task.arms && !task.arms.includes(arm)) return false;

  // Prompts that name no library, or already name a version, have nothing to change.
  if (arm === 'v10') return task.prompts.every((prompt) => nameVersion(prompt) !== prompt);

  // A builder fills in every install choice, so it needs a task that grades one. A pointer to agents init suits any
  // request for Video.js that starts without a player; generic tasks leave the library open.
  if (arm === 'builder') return task.expect.method !== undefined && task.expect.library !== 'any';

  if (arm === 'cli') return task.expect.library !== 'any' && task.suite !== 'customize';

  return true;
}

export interface ArmContext {
  task: Pick<Task, 'expect' | 'builder'>;
  fixture: Pick<Fixture, 'name' | 'dir' | 'template' | 'packageManager'>;
  /** The release under test, which the builder pins the CLI to; `null` for unreleased builds. */
  release: string | null;
}

/** The prompt an arm sends. */
export function armPrompt(prompt: string, arm: Arm, context: ArmContext): string {
  if (arm === 'v10') return nameVersion(prompt);

  if (arm === 'builder') {
    return `${nameVersion(prompt)}\n\nUse Video.js 10. Get the setup steps for this project from:\n\n${builderCommand(context)}`;
  }

  if (arm === 'cli') return `${prompt}\n\nRun \`npx @videojs/cli agents init\` to see how to set it up.`;

  return prompt;
}

function nameVersion(prompt: string): string {
  return prompt.replace(UNVERSIONED, 'Video.js 10');
}

/** The `agents init` command a quickstart would build from the choices the task expects. */
export function builderCommand({ task, fixture, release }: ArmContext): string {
  const { expect } = task;
  const isNew = fixture.name === 'empty';
  const flags: Record<string, string | undefined> = {
    framework: expect.framework === 'any' ? undefined : expect.framework,
    project: isNew ? 'new' : 'existing',
    template: fixture.template ?? undefined,
    method: expect.method,
    preset: expect.preset,
    skin: expect.preset === 'background-video' ? undefined : skinFlag(expect.skin, release),
    media: expect.media,
    'source-url': expect.source ?? 'demo',
    extensions: 'none',
    'package-manager': expect.method === 'cdn' ? undefined : (fixture.packageManager ?? undefined),
    styling: expect.method === 'shadcn' ? (usesTailwind(fixture.dir) ? 'tailwind' : 'css') : undefined,
    ...task.builder,
  };
  const args = Object.entries(flags)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([flag, value]) => `--${flag} ${value}`);

  return `\`\`\`sh\nnpx @videojs/cli@${release ?? 'latest'} agents init ${args.join(' ')}\n\`\`\``;
}

/**
 * The `--skin` value for an expected skin: the minimal skin is `neutral` from 10.0.0-rc.5 on, unreleased builds
 * included.
 */
function skinFlag(skin: TaskExpectation['skin'], release: string | null): string | undefined {
  if (skin !== 'minimal') return skin;

  return release && compareVersions(release, '10.0.0-rc.5') < 0 ? 'minimal' : 'neutral';
}

function usesTailwind(fixtureDir: string): boolean {
  const manifest = join(fixtureDir, 'package.json');
  if (!existsSync(manifest)) return false;

  return /"(?:tailwindcss|@tailwindcss\/[\w-]+)"/.test(readFileSync(manifest, 'utf8'));
}
