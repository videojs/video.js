import { describe, expect, it } from 'vitest';

import { loadTasks } from '../../tasks.ts';
import { ANSWERS, type AnswerCard, answerFor, loadAnswerCard, scoreInteraction } from '../simulator.ts';

const card: AnswerCard = {
  topics: [
    { id: 'app', about: 'which app gets the player', kind: 'necessary', answer: 'The marketing site.' },
    { id: 'source', about: 'which video to play', kind: 'derivable', answer: 'The one I sent you.' },
  ],
  disclose: ['app'],
};

describe('answerFor', () => {
  it('answers card topics in the user’s words and falls back for the rest', () => {
    const { answer, topics } = answerFor(
      {
        blocking: true,
        questions: [
          { text: 'Which app?', kind: 'card', topic: 'app' },
          { text: 'mux-video or hls-video?', kind: 'implementation', topic: null },
        ],
      },
      card
    );

    expect(answer).toBe(`The marketing site. ${ANSWERS.implementation}`);
    expect(topics).toEqual(['app', 'implementation']);
  });

  it('asks a vague question to name the decision', () => {
    expect(
      answerFor({ blocking: true, questions: [{ text: 'How should I proceed?', kind: 'vague', topic: null }] }, card)
        .answer
    ).toBe(ANSWERS.vague);
  });
});

describe('scoreInteraction', () => {
  it('separates needed questions from the rest', () => {
    const interaction = scoreInteraction(
      [
        { question: 'Which app?', topics: ['app'], answer: 'The marketing site.', editedBefore: false },
        { question: 'Which video?', topics: ['source', 'vague'], answer: 'The one I sent you.', editedBefore: false },
      ],
      card,
      true
    );

    expect(interaction).toMatchObject({
      necessary: ['app'],
      askedNecessary: ['app'],
      missedNecessary: [],
      unnecessary: 2,
    });
  });

  it('counts a needed topic nobody asked about as missed', () => {
    expect(scoreInteraction([], card, false)).toMatchObject({
      missedNecessary: ['app'],
      unnecessary: 0,
      disclosed: false,
    });
  });
});

const withCards = loadTasks().filter(({ user }) => user);

describe.skipIf(withCards.length === 0)('answer cards', () => {
  // The simulated user must not hand the agent the grader's vocabulary: users describe outcomes, not options.
  const GRADER_TERMS =
    /\b(?:shadcn|registry|preset|packaged|skin source|adapter|renderer|mux-video|hls-video|html5-video|agents init)\b/i;

  for (const task of withCards) {
    it(`${task.id} answers in the user's words`, () => {
      const loaded = loadAnswerCard(task.user);

      expect(loaded.topics.length).toBeGreaterThan(0);

      for (const topic of loaded.topics) {
        expect(topic.answer).not.toMatch(GRADER_TERMS);
        expect(['necessary', 'derivable', 'indifferent']).toContain(topic.kind);
      }

      for (const id of loaded.disclose ?? []) expect(loaded.topics.map(({ id: topicId }) => topicId)).toContain(id);
    });
  }
});
