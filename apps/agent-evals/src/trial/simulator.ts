// The simulated user of the interactive arm. It answers only what the agent asks, with answers a person wrote on the
// task's answer card: a small model sorts each question into the card's topics and never writes an answer itself, so it
// cannot invent requirements or leak what the grader expects.
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, rmSync } from 'node:fs';

import { exec } from '../lib/exec.ts';
import type { Interaction, InteractionRound } from './result.ts';

/**
 * One thing the user knows. `necessary` changes the right outcome and the project cannot tell the agent, so asking is
 * the only way to get it right; `derivable` is in the prompt or the project; `indifferent` makes no difference to
 * them.
 */
export interface AnswerTopic {
  id: string;
  /** What the topic covers, for sorting questions; never shown to the agent. */
  about: string;
  kind: 'necessary' | 'derivable' | 'indifferent';
  /** What the user says when asked, in their own words. */
  answer: string;
}

export interface AnswerCard {
  topics: AnswerTopic[];
  /** Topics the agent should tell the user it decided on when it decides without asking. */
  disclose?: string[];
}

/** Pinned so every agent faces the same user, release after release. */
export const SIMULATOR_MODEL = 'claude-haiku-4-5-20251001';

/** At most this many questions get answers; after that the user asks the agent to decide. */
export const MAX_ROUNDS = 2;

export const ANSWERS = {
  implementation: "I don't know, use what you recommend.",
  vague: 'Which decision do you need me to make?',
  other: 'Use what you recommend.',
  done: 'Please use your best judgment and make the changes now.',
} as const;

export type QuestionKind = 'card' | 'implementation' | 'vague' | 'other';

export interface TurnQuestions {
  /** Whether the agent stopped to wait for an answer before finishing the work. */
  blocking: boolean;
  questions: Array<{ text: string; kind: QuestionKind; topic: string | null }>;
}

/** A task without an answer card has nothing to ask about, so any question is one the user cannot help with. */
export function loadAnswerCard(path: string | null): AnswerCard {
  return path && existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as AnswerCard) : { topics: [] };
}

const INSTRUCTIONS = `You read the last message a coding agent sent its user at the end of a turn, and report the questions in it.

"blocking" is true when the agent stopped before finishing the requested work to wait for the user: it asks for a decision or information, or says it will wait. An offer after the work is done, such as "want me to commit?" or "I can also add X", is not blocking.

List every question the agent asks the user, blocking or not, and classify each:
- "card": it asks about one of the listed topics. Set "topic" to that topic's id.
- "implementation": it asks the user to pick a technical detail, such as a package, component, adapter, API, or file layout, that no listed topic covers.
- "vague": it asks for direction without naming a decision, such as "what would you like?" or "how should I proceed?".
- "other": any other question, including offers after finishing.
Set "topic" to null unless the kind is "card". Quote each question briefly in "text". An empty list means the message asks nothing.`;

/** Sorts the questions in an agent's message into the card's topics, or `null` when the classifier could not run. */
export async function classifyTurn(message: string, card: AnswerCard, logFile: string): Promise<TurnQuestions | null> {
  const topics = card.topics.map(({ id, about }) => `- ${id}: ${about}`).join('\n') || '(none)';
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['blocking', 'questions'],
    properties: {
      blocking: { type: 'boolean' },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['text', 'kind', 'topic'],
          properties: {
            text: { type: 'string' },
            kind: { type: 'string', enum: ['card', 'implementation', 'vague', 'other'] },
            topic: { enum: [...card.topics.map(({ id }) => id), null] },
          },
        },
      },
    },
  };

  const output = await askModel(
    INSTRUCTIONS,
    `Topics:\n${topics}\n\nThe agent's message:\n<message>\n${message}\n</message>`,
    schema,
    logFile
  );

  return output as TurnQuestions | null;
}

/** The user's reply: the card's answer for each topic asked, and fixed replies for questions they cannot answer. */
export function answerFor(turn: TurnQuestions, card: AnswerCard): { answer: string; topics: string[] } {
  const replies: string[] = [];
  const topics: string[] = [];

  for (const question of turn.questions) {
    const topic = question.kind === 'card' ? card.topics.find(({ id }) => id === question.topic) : undefined;
    const reply = topic ? topic.answer : question.kind === 'card' ? ANSWERS.other : ANSWERS[question.kind];

    topics.push(topic ? topic.id : question.kind);

    if (!replies.includes(reply)) replies.push(reply);
  }

  return { answer: replies.join(' ') || ANSWERS.other, topics };
}

const DISCLOSURE = `You read the final message a coding agent sent its user after finishing a task. For each listed topic, decide whether the message tells the user what the agent chose or assumed about it. Mentioning the topic without saying what was chosen does not count.`;

/** Whether the final message tells the user what the agent decided on each topic the card lists under `disclose`. */
export async function disclosedChoices(message: string, card: AnswerCard, logFile: string): Promise<boolean | null> {
  const topics = card.topics.filter(({ id }) => card.disclose?.includes(id));
  if (topics.length === 0) return null;

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['disclosed'],
    properties: {
      disclosed: {
        type: 'object',
        additionalProperties: false,
        required: topics.map(({ id }) => id),
        properties: Object.fromEntries(topics.map(({ id }) => [id, { type: 'boolean' }])),
      },
    },
  };
  const output = (await askModel(
    DISCLOSURE,
    `Topics:\n${topics.map(({ id, about }) => `- ${id}: ${about}`).join('\n')}\n\nThe agent's final message:\n<message>\n${message}\n</message>`,
    schema,
    logFile
  )) as { disclosed: Record<string, boolean> } | null;

  return output ? Object.values(output.disclosed).every(Boolean) : null;
}

export function scoreInteraction(rounds: InteractionRound[], card: AnswerCard, disclosed: boolean | null): Interaction {
  const necessary = card.topics.filter(({ kind }) => kind === 'necessary').map(({ id }) => id);
  const asked = new Set(rounds.flatMap(({ topics }) => topics));
  const askedNecessary = necessary.filter((id) => asked.has(id));
  const unnecessary = rounds.flatMap(({ topics }) => topics).filter((topic) => !necessary.includes(topic)).length;

  return {
    rounds,
    necessary,
    askedNecessary,
    missedNecessary: necessary.filter((id) => !asked.has(id)),
    unnecessary,
    disclosed,
  };
}

/** One structured-output call to the pinned model, with no tools, settings, or session left behind. */
async function askModel(system: string, prompt: string, schema: object, logFile: string): Promise<unknown> {
  const stdoutFile = `/tmp/simulator-${randomUUID()}.json`;

  await exec(
    'claude',
    [
      '--print',
      '--model',
      SIMULATOR_MODEL,
      '--output-format',
      'json',
      '--no-session-persistence',
      '--strict-mcp-config',
      '--disable-slash-commands',
      '--setting-sources',
      '',
      '--tools',
      '',
      '--system-prompt',
      system,
      '--json-schema',
      JSON.stringify(schema),
      prompt,
    ],
    { cwd: '/tmp', logFile, stdoutFile, timeoutMs: 120_000 }
  );

  try {
    const output = JSON.parse(readFileSync(stdoutFile, 'utf8')) as { structured_output?: unknown; result?: string };

    return output.structured_output ?? (output.result ? JSON.parse(output.result) : null);
  } catch {
    return null;
  } finally {
    rmSync(stdoutFile, { force: true });
  }
}
