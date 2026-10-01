'use client';

import {
  createStatusAnnouncerLabels,
  StatusAnnouncerCore,
  type StatusAnnouncerProps as CoreStatusAnnouncerProps,
  type StatusAnnouncerState,
} from '@videojs/core';
import { shouldAnnounceStatusChange, subscribeToStatusAnnouncer } from '@videojs/core/dom';
import type { ForwardedRef } from 'react';
import { forwardRef, useEffect, useState, useSyncExternalStore } from 'react';

import { useLocale, useTranslator } from '../../i18n/context';
import { useContainer, usePlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { useDestroy } from '../../utils/use-destroy';
import { renderElement } from '../../utils/use-render';

export interface StatusAnnouncerProps
  extends UIComponentProps<'div', StatusAnnouncerState>, Pick<CoreStatusAnnouncerProps, 'closeDelay' | 'labels'> {}

export const StatusAnnouncer = forwardRef(function StatusAnnouncer(
  componentProps: StatusAnnouncerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, closeDelay, labels, ...elementProps } = componentProps;
  const translator = useTranslator();
  const locale = useLocale();
  const [core] = useState(() => new StatusAnnouncerCore());
  const store = usePlayer();
  const container = useContainer();

  useDestroy(core);
  core.setProps({
    closeDelay,
    labels: {
      ...createStatusAnnouncerLabels(translator, locale),
      ...labels,
    },
    shouldAnnounce: () => shouldAnnounceStatusChange(container),
  });

  useEffect(() => subscribeToStatusAnnouncer(store, core), [core, store]);

  const state = useSyncExternalStore(
    (callback) => core.state.subscribe(callback),
    () => core.state.current,
    () => core.state.current
  );

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      ref: forwardedRef,
      props: [
        elementProps,
        {
          role: 'status',
          children: (
            <span key={state.generation} data-status-announcer-content="">
              {state.label ?? ''}
            </span>
          ),
        },
      ],
    }
  );
});

export namespace StatusAnnouncer {
  export type Props = StatusAnnouncerProps;
  export type State = StatusAnnouncerState;
}
