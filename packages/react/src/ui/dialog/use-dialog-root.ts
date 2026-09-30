'use client';

import { DialogCore, DialogDataAttrs, type DialogProps, type DialogState, type StateAttrMap } from '@videojs/core';
import { createDialog, createTransition } from '@videojs/core/dom';
import { useSnapshot } from '@videojs/store/react';
import { useEffect, useLayoutEffect, useState } from 'react';

import { useDestroy } from '../../utils/use-destroy';
import { useLatestRef } from '../../utils/use-latest-ref';
import { useSafeId } from '../../utils/use-safe-id';
import type { DialogContextValue } from './context';

export interface UseDialogRootOptions extends DialogProps {
  onOpenChange?: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  coreFactory?: () => DialogCore;
  stateAttrMap?: StateAttrMap<DialogState>;
  idPrefix?: string;
  interactionRoot?: HTMLElement | null;
}

export function useDialogRoot({
  open: controlledOpen,
  defaultOpen = DialogCore.defaultProps.defaultOpen,
  closeOnEscape = DialogCore.defaultProps.closeOnEscape,
  onOpenChange: onOpenChangeProp,
  onOpenChangeComplete: onOpenChangeCompleteProp,
  coreFactory = createDialogCore,
  stateAttrMap = DialogDataAttrs,
  idPrefix = 'dialog',
  interactionRoot,
}: UseDialogRootOptions): DialogContextValue {
  const [core] = useState(coreFactory);

  core.setProps({ open: controlledOpen, defaultOpen, closeOnEscape });

  const isControlled = controlledOpen !== undefined;
  const onOpenChangeRef = useLatestRef(onOpenChangeProp);
  const onOpenChangeCompleteRef = useLatestRef(onOpenChangeCompleteProp);
  const closeOnEscapeRef = useLatestRef(closeOnEscape);

  const [dialog] = useState(() => {
    const instance = createDialog({
      transition: createTransition(),
      onOpenChange: (nextOpen: boolean) => onOpenChangeRef.current?.(nextOpen),
      onOpenChangeComplete: (nextOpen: boolean) => onOpenChangeCompleteRef.current?.(nextOpen),
      closeOnEscape: () => closeOnEscapeRef.current,
    });

    if (!isControlled && defaultOpen) instance.open();

    return instance;
  });

  const popupId = useSafeId(`${idPrefix}-popup`);
  const titleId = useSafeId(`${idPrefix}-title`);
  const descriptionId = useSafeId(`${idPrefix}-desc`);

  core.setTitleId(titleId);
  core.setDescriptionId(descriptionId);

  useEffect(() => {
    if (controlledOpen === undefined) return;

    const { active: inputOpen } = dialog.input.current;
    if (controlledOpen === inputOpen) return;

    if (controlledOpen) dialog.open();
    else dialog.close();
  }, [controlledOpen, dialog]);

  useLayoutEffect(() => {
    dialog.setInteractionRoot(interactionRoot ?? null);
  }, [dialog, interactionRoot]);

  useDestroy(dialog);

  const input = useSnapshot(dialog.input);
  const modality = useSnapshot(dialog.modality);

  core.setInput(input);
  core.setDocumentModal(modality.documentModal);

  return {
    core,
    dialog,
    state: core.getState(),
    stateAttrMap,
    popupId,
  };
}

function createDialogCore(): DialogCore {
  return new DialogCore();
}
