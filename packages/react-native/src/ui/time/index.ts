// A namespace import rather than `export * as`, which Metro's Babel preset does not transform.
import * as Time from './index.parts';

export { Time };
