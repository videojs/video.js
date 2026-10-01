import { describe, expect, it } from 'vite-plus/test';

import { AlertDialogCore } from '../../alert-dialog/core';
import { DialogCore, type DialogInput } from '../core';

const CLOSED: DialogInput = { active: false, status: 'idle' };
const OPEN: DialogInput = { active: true, status: 'idle' };
const STARTING: DialogInput = { active: true, status: 'starting' };
const ENDING: DialogInput = { active: true, status: 'ending' };

describe('DialogCore', () => {
  it('maps transition input to dialog state', () => {
    const core = new DialogCore();
    const phases = [
      [CLOSED, false, false, false],
      [STARTING, true, true, false],
      [ENDING, true, false, true],
      [OPEN, true, false, false],
    ] as const;

    for (const [input, open, transitionStarting, transitionEnding] of phases) {
      core.setInput(input);
      expect(core.getState()).toMatchObject({ open, status: input.status, transitionStarting, transitionEnding });
    }
  });

  it('assigns and clears label relationships', () => {
    const core = new DialogCore();

    core.setInput(OPEN);
    expect(core.getState().titleId).toBeUndefined();
    expect(core.getState().descriptionId).toBeUndefined();
    expect(core.getPopupAttrs(core.getState())['aria-labelledby']).toBeUndefined();
    expect(core.getPopupAttrs(core.getState())['aria-describedby']).toBeUndefined();

    core.setTitleId('title-1');
    core.setDescriptionId('description-1');
    expect(core.getState().titleId).toBe('title-1');
    expect(core.getState().descriptionId).toBe('description-1');

    core.setTitleId(undefined);
    core.setDescriptionId(undefined);
    expect(core.getState().titleId).toBeUndefined();
    expect(core.getState().descriptionId).toBeUndefined();
    expect(core.getPopupAttrs(core.getState())['aria-labelledby']).toBeUndefined();
    expect(core.getPopupAttrs(core.getState())['aria-describedby']).toBeUndefined();
  });

  it('returns modal dialog semantics and label relationships', () => {
    const core = new DialogCore();

    core.setInput(OPEN);
    core.setTitleId('title-1');
    core.setDescriptionId('description-1');

    expect(core.getPopupAttrs(core.getState())).toEqual({
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'title-1',
      'aria-describedby': 'description-1',
    });
  });

  it('omits aria-modal for a scoped dialog', () => {
    const core = new DialogCore();

    core.setInput(OPEN);
    core.setDocumentModal(false);

    expect(core.getPopupAttrs(core.getState())['aria-modal']).toBeUndefined();
  });

  it('connects a trigger to the popup', () => {
    const core = new DialogCore();

    core.setInput(OPEN);

    expect(core.getTriggerAttrs(core.getState(), 'dialog-1')).toEqual({
      'aria-expanded': 'true',
      'aria-haspopup': 'dialog',
      'aria-controls': 'dialog-1',
    });
  });
});

describe('AlertDialogCore', () => {
  it('returns alertdialog role and aria-modal', () => {
    const core = new AlertDialogCore();

    core.setInput(OPEN);
    const attrs = core.getPopupAttrs(core.getState());

    expect(attrs.role).toBe('alertdialog');
    expect(attrs['aria-modal']).toBe('true');
  });
});
