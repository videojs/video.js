import type { ComponentTarget } from 'vjsc/target';

import { createHtmlIconTarget, createReactIconTarget } from '../../../icons/vjsc/target.ts';
import { skinStyles } from '../../src/meta.ts';
import type { SkinVariant } from '../variants.ts';
import { htmlComponentTarget } from './html.tsx';
import { reactComponentTarget } from './react.tsx';

const iconTargets = new Map<string, ComponentTarget>();

export function createComponentTargets(config: SkinVariant): readonly ComponentTarget[] {
  const family = config.skin ? skinStyles[config.skin].theme : config.theme;
  const key = `${config.target}:${family}`;
  let icons = iconTargets.get(key);

  if (!icons) {
    const created = config.target === 'react' ? createReactIconTarget({ family }) : createHtmlIconTarget({ family });

    icons = created;
    iconTargets.set(key, created);
  }

  return [config.target === 'react' ? reactComponentTarget : htmlComponentTarget, icons];
}
