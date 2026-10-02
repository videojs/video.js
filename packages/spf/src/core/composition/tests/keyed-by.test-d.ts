import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { CheckKeyedFields, KeyedBy } from '../keyed-by';

interface Server {
  url: string;
}
interface Config {
  interval?: number;
  systems?: readonly { id: string }[];
  servers?: KeyedBy<'systems', 'id', Server>;
}
const defaults = { systems: [{ id: 'a' }, { id: 'b' }] as const };

type Defaults = typeof defaults;

type Passes<C> = CheckKeyedFields<Config, C, Defaults>;

describe('CheckKeyedFields', () => {
  it('ignores fields that are not keyed', () => {
    expectTypeOf<Passes<{ interval: 250 }>>().toEqualTypeOf<unknown>();
  });

  it('accepts keys its source lists', () => {
    expectTypeOf<Passes<{ systems: readonly [{ id: 'x' }]; servers: { x: Server } }>>().toEqualTypeOf<unknown>();
  });

  it('reads the source from the defaults when the config leaves it out', () => {
    expectTypeOf<Passes<{ servers: { a: Server } }>>().toEqualTypeOf<unknown>();
    expectTypeOf<Passes<{ servers: { x: Server } }>>().not.toEqualTypeOf<unknown>();
  });

  it('names the field and the keys its source does not list', () => {
    expectTypeOf<Passes<{ systems: readonly [{ id: 'x' }]; servers: { y: Server } }>>().toEqualTypeOf<{
      'Error: a keyed config field names ids its source list does not': {
        field: 'servers';
        notIn: 'systems';
        keys: 'y';
      };
    }>();
  });

  it('leaves records with plain string keys unchecked', () => {
    expectTypeOf<Passes<{ servers: Partial<Record<string, Server>> }>>().toEqualTypeOf<unknown>();
  });

  it('accepts any key when the source list is not literal', () => {
    expectTypeOf<Passes<{ systems: readonly { id: string }[]; servers: { y: Server } }>>().toEqualTypeOf<unknown>();
  });
});
