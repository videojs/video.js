'use client';

import { LiveButtonCore, LiveButtonDataAttrs, type LiveButtonMediaState } from '@videojs/core';
import { logMissingFeature, selectBuffer, selectLive, selectTime } from '@videojs/core/dom';
import { translateText } from '@videojs/core/i18n';
import { forwardRef, type ReactNode, useLayoutEffect, useState } from 'react';

import { useTranslator } from '../../i18n/context';
import { usePlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useButton } from '../hooks/use-button';
import { useOptionalTooltipContext } from '../tooltip/context';

const DISPLAY_NAME = 'LiveButton';

export interface LiveButtonProps extends UIComponentProps<'button', LiveButtonCore.State>, LiveButtonCore.Props {}

/**
 * A button that indicates live status and seeks to the live edge when pressed. Exposes `data-live` while the stream is
 * live (or DVR) and `data-live-edge` while playing at the live edge so skins can style a red-dot ↔ grey-dot treatment.
 *
 * Selects from `live`, `time`, and `buffer` features and composes them itself rather than going through
 * `createMediaButton`, since the LiveButton needs three feature slices to detect the live edge and seek.
 *
 * Displays the translated live badge when no children are provided.
 *
 * @example
 *   ```tsx
 *   <LiveButton />;
 *   ```;
 *
 * @see https://github.com/video-dev/media-ui-extensions/blob/main/proposals/0007-live-edge.md
 */
export const LiveButton = forwardRef<HTMLButtonElement, LiveButtonProps>(
  function LiveButton(componentProps, forwardedRef): ReactNode {
    const { children, render, className, style, label, disabled, ...elementProps } = componentProps;

    const live = usePlayer(selectLive);
    const time = usePlayer(selectTime);
    const buffer = usePlayer(selectBuffer);

    const media: LiveButtonMediaState | null =
      live && time && buffer
        ? {
            currentTime: time.currentTime,
            seek: time.seek,
            seekable: buffer.seekable,
            liveEdgeStart: live.liveEdgeStart,
            targetLiveWindow: live.targetLiveWindow,
          }
        : null;

    const tooltipCtx = useOptionalTooltipContext();
    const translator = useTranslator();
    const [core] = useState(() => new LiveButtonCore());

    core.setProps({ label, disabled });

    const { getButtonProps, buttonRef } = useButton({
      displayName: DISPLAY_NAME,
      onActivate: () => {
        if (media) core.seekToLive(media);
      },
      isDisabled: () => !!disabled || !media,
    });

    if (media) core.setMedia(media);

    const state = media ? core.getState() : null;
    const labelText = state ? translateText(core.getLabel(state), translator) : undefined;

    useLayoutEffect(() => {
      if (!tooltipCtx) return;

      tooltipCtx.setContent(labelText ? { label: labelText } : undefined);
      return () => tooltipCtx.setContent(undefined);
    }, [tooltipCtx, labelText]);

    if (!media || !state) {
      if (__DEV__) logMissingFeature(DISPLAY_NAME, selectLive.displayName ?? 'live');

      return null;
    }

    const attrs = core.getAttrs(state);
    const labelAttr = attrs['aria-label'];
    const content = children ?? translateText(LiveButtonCore.defaultText, translator);

    return renderElement(
      'button',
      { render, className, style },
      {
        state,
        stateAttrMap: LiveButtonDataAttrs,
        ref: [forwardedRef, buttonRef],
        props: [
          attrs,
          {
            children: content,
            ...elementProps,
            'aria-label': labelAttr ? translateText(labelAttr, translator) : labelAttr,
          },
          getButtonProps(),
        ],
      }
    );
  }
);

LiveButton.displayName = DISPLAY_NAME;

export namespace LiveButton {
  export type Props = LiveButtonProps;
  export type State = LiveButtonCore.State;
}
