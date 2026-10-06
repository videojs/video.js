import * as $ from '@videojs/core/vjsc';
import { SpinnerIcon } from '@videojs/icons/vjsc';
import { type ClassNameValue, type PropsOf, Slot } from 'vjsc/components';

import bufferingStyles from './buffering.styles';
import posterStyles from './poster.styles';

export function Poster({ renderImage }: { renderImage?: PropsOf<typeof $.Poster.Image>['children'] } = {}) {
  return (
    <$.Poster.Root className={posterStyles.root}>
      <Slot name="poster">
        <$.Poster.Image className={posterStyles.image}>{renderImage}</$.Poster.Image>
      </Slot>
    </$.Poster.Root>
  );
}

export function BufferingIndicator({ className }: { className?: ClassNameValue } = {}) {
  return (
    <$.BufferingIndicator className={[bufferingStyles.root, className]}>
      <SpinnerIcon className={bufferingStyles.spinnerIcon} />
    </$.BufferingIndicator>
  );
}
