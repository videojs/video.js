'use client';

import { TimeCore, TimeDataAttrs } from '@videojs/core';
import { logMissingFeature, selectBuffer, selectTime } from '@videojs/core/dom';
import { translateText } from '@videojs/core/i18n';
import { durationSuffixText, elapsedSuffixText, remainingSuffixText } from '@videojs/core/i18n/text/time';
import { isInteractiveActivation } from '@videojs/utils/dom';
import { formatTimeAsPhrase } from '@videojs/utils/time';
import type { ForwardedRef, KeyboardEvent, MouseEvent } from 'react';
import { forwardRef, useEffect, useState } from 'react';

import { useLocale, useTranslator } from '../../i18n/context';
import { usePlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';

export interface ValueProps extends Omit<UIComponentProps<'time', TimeCore.State>, 'children'>, TimeCore.Props {}

/**
 * Displays a formatted time value (current, duration, or remaining).
 *
 * @example
 *   ```tsx
 *   <Time.Value />
 *   <Time.Value type="duration" />
 *   <Time.Value type="remaining" negativeSign="−" />
 *   ```;
 */
export const Value = forwardRef(function Value(
  componentProps: ValueProps,
  forwardedRef: ForwardedRef<HTMLTimeElement>
) {
  const { render, className, style, type, negativeSign, label, toggle = false, ...elementProps } = componentProps;

  const time = usePlayer(selectTime);
  const buffer = usePlayer(selectBuffer);
  const translator = useTranslator();
  const locale = useLocale();

  const [core] = useState(() => new TimeCore());

  const defaultType = type ?? TimeCore.defaultProps.type;
  const [activeType, setActiveType] = useState(defaultType);

  // We want to listen for changes to defaultType and toggle (so we revert to default), this just means one less useEffect.
  // oxlint-disable-next-line react/exhaustive-deps
  useEffect(() => {
    setActiveType(defaultType);
  }, [defaultType, toggle]);

  core.setProps({
    type: activeType,
    negativeSign,
    label,
    toggle,
  });

  if (!time) {
    if (__DEV__) logMissingFeature('Time.Value', 'time');

    return null;
  }

  core.setMedia({ ...time, seekable: buffer?.seekable ?? [] });
  core.setFormatLocale(locale);
  const state = core.getState();
  const attrs = core.getAttrs(state, defaultType);
  const labelParams = core.getLabelParams(state);
  const suffixText = {
    current: elapsedSuffixText,
    duration: durationSuffixText,
    remaining: remainingSuffixText,
  }[state.type];
  const resolvedLabelParams = labelParams
    ? {
        duration: translateText(suffixText, translator, {
          duration: formatTimeAsPhrase(Math.abs(state.seconds), { locale }),
        }),
      }
    : undefined;

  const content = state.negative ? (
    <>
      <span aria-hidden="true">{negativeSign ?? TimeCore.defaultProps.negativeSign}</span>
      {state.text}
    </>
  ) : (
    state.text
  );

  const toggleType = () => {
    setActiveType((value) => {
      if (defaultType === 'current') {
        return value === 'remaining' ? 'current' : 'remaining';
      }

      return value === 'duration' ? 'remaining' : 'duration';
    });
  };

  const handleClick = (event: MouseEvent<HTMLTimeElement>) => {
    if (event.defaultPrevented || state.disabled) return;

    toggleType();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTimeElement>) => {
    if (event.defaultPrevented || state.disabled || !isInteractiveActivation(event.nativeEvent)) return;

    // Prevent space from scrolling page.
    event.preventDefault();

    if (event.repeat) return;

    toggleType();
  };

  return renderElement(
    'time',
    { render, className, style },
    {
      state,
      stateAttrMap: TimeDataAttrs,
      ref: [forwardedRef],
      props: [
        {
          dateTime: toggle || state.unavailable ? undefined : state.datetime,
          children: content,
          ...attrs,
          'aria-label': translateText(attrs['aria-label'], translator, resolvedLabelParams),
          'aria-description': attrs['aria-description']
            ? translateText(attrs['aria-description'], translator)
            : undefined,
          ...(toggle ? { onClick: handleClick, onKeyDown: handleKeyDown } : undefined),
        },
        elementProps,
      ],
    }
  );
});

export namespace Value {
  export type Props = ValueProps;
  export type State = TimeCore.State;
}
