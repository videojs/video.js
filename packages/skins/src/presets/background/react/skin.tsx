'use client';

import { cn } from '@videojs/utils/style';

import type { BaseSkinProps } from '../types';

export type BackgroundVideoSkinProps = BaseSkinProps;

export function BackgroundVideoSkin(props: BackgroundVideoSkinProps) {
  const { children, className, ...rest } = props;

  return (
    <div className={cn('media-background-skin', className)} {...rest}>
      {children}
    </div>
  );
}
