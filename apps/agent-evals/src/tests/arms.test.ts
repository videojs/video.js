import { describe, expect, it } from 'vitest';

import { armApplies, armPrompt, builderCommand } from '../arms.ts';
import { loadFixture, loadTasks } from '../tasks.ts';

const tasks = new Map(loadTasks().map((task) => [task.id, task]));
const context = (id: string, release: string | null = '10.0.0-rc.4') => {
  const task = tasks.get(id)!;

  return { task, fixture: loadFixture(task.fixture), release };
};

describe('armPrompt', () => {
  const prompt = 'Add a Video.js video player to the home page. Use the Video.js minimal skin.';

  it('names Video.js 10 in the v10 arm, every time', () => {
    const named = 'Add a Video.js 10 video player to the home page. Use the Video.js 10 minimal skin.';
    const options = context('react-next-packaged');

    expect(armPrompt(prompt, 'v10', options)).toBe(named);
    expect(armPrompt(prompt, 'v10', options)).toBe(named);
  });

  it('keeps the prompt as written in the baseline, skill, and interactive arms', () => {
    for (const arm of ['baseline', 'skill', 'interactive'] as const) {
      expect(armPrompt(prompt, arm, context('react-next-packaged'))).toBe(prompt);
    }
  });

  it('appends a pinned agents init command in the builder arm', () => {
    const built = armPrompt(prompt, 'builder', context('react-next-packaged'));

    expect(built).toContain('Use Video.js 10.');
    expect(built).toContain(
      'npx @videojs/cli@10.0.0-rc.4 agents init --framework react --project existing --template next --method packaged --preset video --skin default --media html5-video --source-url https://stream.mux.com/'
    );
    expect(built).toContain('--extensions none --package-manager pnpm');
  });

  it('points at agents init without flags in the cli arm', () => {
    expect(armPrompt(prompt, 'cli', context('react-next-packaged'))).toBe(
      `${prompt}\n\nRun \`npx @videojs/cli agents init\` to see how to set it up.`
    );
  });
});

describe('builderCommand', () => {
  it('picks the styling a shadcn install needs from the fixture', () => {
    expect(builderCommand(context('react-next-shadcn'))).toContain('--method shadcn');
    expect(builderCommand(context('react-next-shadcn'))).toContain('--styling tailwind');
    expect(builderCommand(context('html-vite-shadcn'))).toContain('--styling css');
  });

  it('leaves out the skin for background video and the package manager for the CDN', () => {
    expect(builderCommand(context('react-next-background'))).not.toContain('--skin');
    expect(builderCommand(context('html-static-cdn-hls'))).not.toContain('--package-manager');
  });

  it('falls back to latest for unreleased builds', () => {
    expect(builderCommand(context('react-next-packaged', null))).toContain('npx @videojs/cli@latest agents init');
  });
});

describe('armApplies', () => {
  it('runs v10 only where every wording names Video.js without a version', () => {
    expect(armApplies(tasks.get('react-next-packaged')!, 'v10')).toBe(true);
    expect(armApplies(tasks.get('migrate-v8')!, 'v10')).toBe(false);
    expect(armApplies(tasks.get('generic-podcast')!, 'v10')).toBe(false);
  });

  it('runs builder and cli only on installs of Video.js', () => {
    expect(armApplies(tasks.get('react-next-packaged')!, 'builder')).toBe(true);
    expect(armApplies(tasks.get('customize-captions')!, 'builder')).toBe(false);
    expect(armApplies(tasks.get('generic-podcast')!, 'cli')).toBe(false);
  });

  it('honors a task that limits its arms', () => {
    const task = { ...tasks.get('react-next-packaged')!, arms: ['builder'] };

    expect(armApplies(task, 'builder')).toBe(true);
    expect(armApplies(task, 'baseline')).toBe(false);
  });
});
