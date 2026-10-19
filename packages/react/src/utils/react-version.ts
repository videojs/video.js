'use client';

import { version } from 'react';

/**
 * React 19 passes `ref` to function components as a prop and knows the `inert` and `fetchPriority` DOM props. Earlier
 * versions deliver `ref` only through `forwardRef`, drop `inert={true}`, and ignore the camelCase `fetchPriority`.
 */
export const IS_REACT_19 = Number.parseInt(version, 10) >= 19;
