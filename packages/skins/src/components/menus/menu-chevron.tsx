import { ChevronIcon } from '@videojs/icons/vjsc';
import type { ClassNameValue } from 'vjsc/components';

import type { SkinSupportDescription } from '../../meta';
import styles from '../../styles/menus/menu.styles';

export interface MenuChevronProps {
  back?: boolean;
  className?: ClassNameValue;
}

export function MenuChevron({ back = false, className }: MenuChevronProps = {}) {
  return <ChevronIcon className={[back ? styles.backChevron : styles.forwardChevron, className]} />;
}

export const meta = {
  type: 'support',
  title: 'Video.js Menu Chevron',
  description: 'Private menu direction indicator shared by editable Video.js menu components.',
} as const satisfies SkinSupportDescription;
