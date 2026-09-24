import { kebabCaseName } from '@videojs/utils/string';

import type { SourceProps } from './definition';
import { isSourcePropsToken, SOURCE_PROPS } from './source';

const MARKER_PREFIX = 'data-vjsc-render-';

/** The attribute an HTML target leaves on a canonical host so its rule can hand the host to a shared component. */
export function renderTargetMarker(name: string): string {
  return `${MARKER_PREFIX}${kebabCaseName(name)}`;
}

/** Whether an attribute name is a render marker left for a component rule to consume. */
export function isRenderTargetMarker(name: string): boolean {
  return name.startsWith(MARKER_PREFIX);
}

/** Consume whichever render marker the props carry, so rules need not enumerate every shared component. */
export function consumeRenderTarget<Props extends object>(props: SourceProps<Props>): SourceProps<Props> | undefined {
  const token = (props as SourceProps<Props> & { readonly [SOURCE_PROPS]?: unknown })[SOURCE_PROPS];
  if (!isSourcePropsToken(token)) return undefined;

  for (const attribute of token.attributes) {
    if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier') continue;

    const name = attribute.name.name;

    if (name.startsWith(MARKER_PREFIX) && !token.omitted.has(name)) {
      return props.omit(name as keyof Props & string) as SourceProps<Props>;
    }
  }

  return undefined;
}
