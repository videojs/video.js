'use client';

import { TitleCore, TitleDataAttrs, type TitleState } from '@videojs/core';
import { logMissingFeature, selectControls, selectMetadata } from '@videojs/core/dom';
import type { ForwardedRef } from 'react';
import { forwardRef, useState } from 'react';

import { usePlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';

export interface TitleProps extends Omit<UIComponentProps<'div', TitleState>, 'children'> {}

/**
 * Displays the resolved content title. Renders nothing when no title resolves.
 *
 * The component owns its text content. Set the title through the player's `title` prop rather than by passing children.
 *
 * @example
 *   ```tsx
 *   <Title />
 *   ```;
 */
export const Title = forwardRef(function Title(componentProps: TitleProps, forwardedRef: ForwardedRef<HTMLDivElement>) {
  const { render, className, style, ...elementProps } = componentProps;

  const metadata = usePlayer(selectMetadata);
  const controls = usePlayer(selectControls);

  const [core] = useState(() => new TitleCore());

  if (!metadata) {
    if (__DEV__) logMissingFeature('Title', 'metadata');

    return null;
  }

  const state = core.getState(metadata, controls);
  if (state.hidden) return null;

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      stateAttrMap: TitleDataAttrs,
      ref: [forwardedRef],
      props: [{ children: state.title }, elementProps],
    }
  );
});

export namespace Title {
  export type Props = TitleProps;
  export type State = TitleState;
}
