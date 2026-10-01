import { createContext } from '@videojs/element/context';

/** @internal */
export interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const RADIO_GROUP_CONTEXT_KEY = Symbol('@videojs/radio-group');

/** @internal */
export const radioGroupContext = createContext<RadioGroupContextValue>(RADIO_GROUP_CONTEXT_KEY);
