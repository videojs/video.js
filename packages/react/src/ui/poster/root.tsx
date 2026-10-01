'use client';

import { PosterCore, PosterDataAttrs, type PosterImageLoadState, type PosterState } from '@videojs/core';
import { logMissingFeature, selectMetadata, selectPlayback } from '@videojs/core/dom';
import type { ForwardedRef } from 'react';
import { forwardRef, useState } from 'react';

import { usePlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { PosterProvider } from './context';

export interface PosterRootProps extends UIComponentProps<'div', PosterState> {}

/**
 * Manages poster visibility and image loading state.
 *
 * Renders a `div` and exposes `data-visible`, `data-loading`, `data-loaded`, and `data-error` for styling every layer
 * in the poster presentation. Render `Poster.Image` inside it for the image that supplies the loading lifecycle.
 */
export const PosterRoot = forwardRef(function PosterRoot(
  componentProps: PosterRootProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, ...elementProps } = componentProps;

  const playback = usePlayer(selectPlayback);
  const metadata = usePlayer(selectMetadata);

  const [core] = useState(() => new PosterCore());
  const [reportedLoadState, setImageLoadState] = useState<PosterImageLoadState | null>(null);

  if (!playback) {
    if (__DEV__) logMissingFeature('Poster.Root', 'playback');

    return null;
  }

  // The metadata feature is optional: without it nothing resolves a URL, and
  // this stays a visibility wrapper around whatever source the image supplies.
  core.setMedia({
    started: playback.started,
    poster: metadata?.poster ?? '',
  });

  // Until the image reports, a resolved poster is on its way. Server markup then
  // already carries `data-loading`, and hydration lands on the state the image
  // reports first rather than flashing the layers keyed off that attribute.
  core.setImageLoadState(reportedLoadState ?? (metadata?.poster ? 'loading' : 'none'));

  const state = core.getState();

  return (
    <PosterProvider value={{ state, setImageLoadState }}>
      {renderElement(
        'div',
        { render, className, style },
        {
          state,
          stateAttrMap: PosterDataAttrs,
          ref: forwardedRef,
          props: elementProps,
        }
      )}
    </PosterProvider>
  );
});

export namespace PosterRoot {
  export type Props = PosterRootProps;
  export type State = PosterState;
}
