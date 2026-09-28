import { RuleTester } from 'vite-plus/lint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { noModuleMockingRule } from '../no-module-mocking.ts';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' } },
});

ruleTester.run('no-module-mocking', noModuleMockingRule, {
  valid: [
    {
      name: 'unrelated vi import',
      code: "import { vi } from './fixtures'; vi.mock('./module');",
    },
    {
      name: 'test spy remains allowed',
      code: "import { vi } from 'vite-plus/test'; vi.spyOn(console, 'log');",
    },
  ],
  invalid: [
    {
      name: 'Vite+ Test module mock',
      code: "import { vi } from 'vite-plus/test'; vi.mock('./module');",
      errors: [{ messageId: 'moduleMock' }],
    },
    {
      name: 'aliased Vite+ Test import',
      code: "import { vi as testVi } from 'vite-plus/test'; testVi.doMock('./module');",
      errors: [{ messageId: 'moduleMock' }],
    },
    {
      name: 'Vitest module mock remains banned',
      code: "import { vi } from 'vitest'; vi.mock('./module');",
      errors: [{ messageId: 'moduleMock' }],
    },
  ],
});
