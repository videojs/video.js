import type { DialogCore, DialogState, StateAttrMap } from '@videojs/core';
import type { DialogApi } from '@videojs/core/dom';
import { createContext } from '@videojs/element/context';

/** @internal */
export interface DialogContextValue {
  state: DialogState;
  stateAttrMap: StateAttrMap<DialogState>;
  dialog: DialogApi;
  popupId: string;
  popupAttrs: ReturnType<DialogCore['getPopupAttrs']>;
  close: () => void;
}

const DIALOG_CONTEXT_KEY = Symbol('@videojs/dialog');

/** @internal */
export const dialogContext = createContext<DialogContextValue>(DIALOG_CONTEXT_KEY);
