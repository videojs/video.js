import type { SkinFlag } from '@videojs/installation';
import type { ComponentType, SVGProps } from 'react';

import CircleIcon from '@/assets/icons/circle.svg?react';
import GlobeIcon from '@/assets/icons/globe.svg?react';
import PuzzleIcon from '@/assets/icons/puzzle-24.svg?react';
import SparkleIcon from '@/assets/icons/sparkle.svg?react';
import SquareHintIcon from '@/assets/icons/square-hint.svg?react';

/**
 * The default skin is the distinctly Video.js one, neutral the one to brand, compat the one for older browsers, scaffold
 * the wireframe to restyle, and no skin builds the UI from components.
 */
const SKIN_ICONS = {
  default: SparkleIcon,
  neutral: CircleIcon,
  compat: GlobeIcon,
  scaffold: SquareHintIcon,
  none: PuzzleIcon,
} satisfies Record<SkinFlag, ComponentType<SVGProps<SVGSVGElement>>>;

interface SkinIconProps {
  skin: SkinFlag;
  className?: string;
}

export default function SkinIcon({ skin, className }: SkinIconProps) {
  const Icon = SKIN_ICONS[skin];

  return <Icon className={className} aria-hidden="true" />;
}
