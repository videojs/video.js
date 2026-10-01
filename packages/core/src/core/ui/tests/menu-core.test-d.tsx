import { describe, expectTypeOf, it } from 'vite-plus/test';

import { MenuCore, type MenuInput, type MenuProps, type MenuState } from '../menu/core';

describe('MenuCore', () => {
  it('exports Props, State, and Input aliases through its namespace', () => {
    expectTypeOf<MenuCore.Props>().toEqualTypeOf<Omit<MenuProps, 'boundary'>>();
    expectTypeOf<MenuCore.State>().toEqualTypeOf<MenuState>();
    expectTypeOf<MenuCore.Input>().toEqualTypeOf<MenuInput>();
  });
});
