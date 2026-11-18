import { type Text, type TextParams, translateText } from '@videojs/core/i18n';
import { isUndefined } from '@videojs/utils/predicate';
import type { Role } from 'react-native';

/** The ARIA subset `*Core.getAttrs()` emits that has a react-native equivalent. */
export interface CoreA11yAttrs {
  role?: string | undefined;
  'aria-label'?: Text | string | undefined;
  /** Cores emit the DOM string `'true'`, or omit it. */
  'aria-disabled'?: string | undefined;
  'aria-valuemin'?: number | undefined;
  'aria-valuemax'?: number | undefined;
  'aria-valuenow'?: number | undefined;
  'aria-valuetext'?: Text | string | undefined;
}

// A type alias rather than an interface so it satisfies `Record<string, unknown>` helpers such as `omit`.
export type NativeA11yProps = {
  role?: Role | undefined;
  'aria-label'?: string | undefined;
  'aria-disabled'?: boolean | undefined;
  'aria-valuemin'?: number | undefined;
  'aria-valuemax'?: number | undefined;
  'aria-valuenow'?: number | undefined;
  'aria-valuetext'?: string | undefined;
};

/** Placeholder values for the text a core emits, such as a seek button's `{seconds}`. */
export interface NativeA11yParams {
  label?: TextParams | undefined;
  valueText?: TextParams | undefined;
}

/**
 * Map a core's ARIA attributes to react-native accessibility props.
 *
 * React Native accepts the same `aria-*` names, but cores emit i18n text descriptors and DOM string booleans, plus
 * attributes (`tabIndex`, `autoComplete`) with no native meaning, so spreading them directly is wrong. Text resolves to
 * its English default until react-native has a translator.
 */
export function toNativeA11yProps(attrs: CoreA11yAttrs, params: NativeA11yParams = {}): NativeA11yProps {
  const props: NativeA11yProps = {};

  if (attrs.role) props.role = attrs.role as Role;

  if (attrs['aria-label']) props['aria-label'] = translateText(attrs['aria-label'], params.label);

  if (attrs['aria-disabled'] === 'true') props['aria-disabled'] = true;

  if (!isUndefined(attrs['aria-valuemin'])) props['aria-valuemin'] = attrs['aria-valuemin'];

  if (!isUndefined(attrs['aria-valuemax'])) props['aria-valuemax'] = attrs['aria-valuemax'];

  if (!isUndefined(attrs['aria-valuenow'])) props['aria-valuenow'] = attrs['aria-valuenow'];

  if (attrs['aria-valuetext']) props['aria-valuetext'] = translateText(attrs['aria-valuetext'], params.valueText);

  return props;
}
