import type { PlayButtonProps as CoreProps } from '@videojs/core';
import * as $ from '@videojs/core/vjsc';
import { PauseIcon, PlayIcon, RestartIcon } from '@videojs/icons/vjsc';
import type { ClassNameValue, Props } from 'vjsc/components';

import type { SkinComponentDescription } from '../../meta';
import buttonStyles from '../../styles/buttons/button.styles';
import styles from '../../styles/buttons/play-button.styles';
import { Button } from './button';

export function PlayButton({
  className,
  iconClassName,
  ...props
}: Props<CoreProps & { iconClassName?: ClassNameValue }> = {}) {
  return (
    <$.PlayButton $render={Button} className={[styles.root, className]} {...props}>
      <RestartIcon className={[buttonStyles.icon, styles.restartIcon, iconClassName]} />
      <PlayIcon className={[buttonStyles.icon, styles.playIcon, iconClassName]} />
      <PauseIcon className={[buttonStyles.icon, styles.pauseIcon, iconClassName]} />
    </$.PlayButton>
  );
}

export const meta = {
  title: 'Play Button',
  description: 'A three-state button that plays, pauses, or restarts media with matching icons.',
} as const satisfies SkinComponentDescription;
