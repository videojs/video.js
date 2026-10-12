import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vite-plus/test';

import { defineComponent, defineSchema } from '../../components/definition';
import {
  boundCanonicalPath,
  configuredRule,
  displayPath,
  indexTargetBindings,
  resolveTargetElement,
  resolveTargetRule,
} from '../bindings';
import { defineComponentTarget, isTargetElement, TARGET_ELEMENT } from '../definition';

const schema = defineSchema('@fixture/components', {
  Button: defineComponent({ name: 'Button' }),
  Menu: defineComponent({
    name: 'Menu',
    root: 'Root',
    parts: { Root: defineComponent(), Trigger: defineComponent(), Content: defineComponent() },
  }),
});

const target = defineComponentTarget<typeof schema>()(({ element, imported }) => ({
  source: '@fixture/components',
  components: {
    resolve: ({ component, parts }) => imported({ from: '@fixture/react', name: component, path: [...parts] }),
    rules: {
      Button: element('button'),
      Menu: { Trigger: () => null },
    },
  },
  primitives: { Box: element('div') },
  jsx: { importSource: 'react', attributes: 'react' },
}));

describe('indexTargetBindings', () => {
  it('indexes canonical, primitive, template, and named imports from one scan', () => {
    const bindings = index(`
      import * as $ from '@fixture/components';
      import { Menu as M } from '@fixture/components';
      import { Box, Template, type Props } from 'vjsc/components';
      import type { Local } from './local';
    `);

    expect(bindings.namespaces.get('$')).toBe(target);
    expect(bindings.named.get('M')).toMatchObject({ component: 'Menu', parts: [] });
    expect(bindings.primitives.get('Box')).toMatchObject({ name: 'Box', target });
    expect(bindings.template).toBe('Template');
    expect(bindings.imports.get('Props')).toEqual({ source: 'vjsc/components', imported: 'Props', type: true });
    expect(bindings.imports.get('Local')).toEqual({ source: './local', imported: 'Local', type: true });
  });

  it('rejects two targets for one source and two owners for one primitive', () => {
    const ast = parseSync('fixture.tsx', `import { Box } from 'vjsc/components';`).program;
    const other = { ...target, source: '@fixture/other' };

    expect(() => indexTargetBindings(ast, [target, target])).toThrow('More than one component target was provided');
    expect(() => indexTargetBindings(ast, [target, other])).toThrow(
      expect.objectContaining({ message: expect.stringContaining('`Box` primitive'), pos: 9 })
    );
  });
});

describe('boundCanonicalPath', () => {
  it('reads namespace and named paths into a component and its part path', () => {
    const bindings = index(`import * as $ from '@fixture/components';\nimport { Menu } from '@fixture/components';`);

    expect(boundCanonicalPath(['$', 'Menu', 'Trigger'], bindings)).toMatchObject({
      component: 'Menu',
      parts: ['Trigger'],
    });
    expect(boundCanonicalPath(['Menu', 'Content'], bindings)).toMatchObject({ component: 'Menu', parts: ['Content'] });
    expect(boundCanonicalPath(['$'], bindings)).toBeUndefined();
    expect(displayPath({ component: 'Menu', parts: ['Trigger'] })).toBe('Menu.Trigger');
  });
});

describe('resolveTargetRule', () => {
  it('prefers the configured rule and falls back to the resolver', () => {
    const button = { target, component: 'Button', parts: [] };
    const trigger = { target, component: 'Menu', parts: ['Trigger'] };
    const content = { target, component: 'Menu', parts: ['Content'] };

    expect(configuredRule(button)).toBe(target.components.rules.Button);
    expect(resolveTargetRule(trigger)).toBe(configuredRule(trigger));
    expect(isTargetElement(resolveTargetRule(content))).toBe(true);
  });
});

describe('resolveTargetElement', () => {
  it('follows the conventional element when the configured rule is a rewrite', () => {
    const element = resolveTargetElement({ target, component: 'Menu', parts: ['Trigger'] });

    expect(element?.[TARGET_ELEMENT]).toEqual({
      kind: 'import',
      import: { from: '@fixture/react', name: 'Menu', path: ['Trigger'] },
    });
  });
});

function index(code: string) {
  return indexTargetBindings(parseSync('fixture.tsx', code).program, [target]);
}
