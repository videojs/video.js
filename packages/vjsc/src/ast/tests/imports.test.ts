import { parseSync } from 'oxc-parser';
import { RolldownMagicString } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { ModuleImports } from '..';

describe('ModuleImports', () => {
  it('reuses existing imports and allocates collision-safe names', () => {
    const code = `import { existing as local } from 'library';\nconst requested = true;`;
    const ast = parseSync('fixture.ts', code).program;
    const magicString = new RolldownMagicString(code);
    const imports = new ModuleImports(ast, magicString);

    expect(imports.reference({ from: 'library', name: 'existing' })).toBe('local');
    expect(imports.reference({ from: 'library', name: 'requested' })).toBe('requestedImport');
    expect(imports.reference({ from: 'library', name: 'namespace', path: ['part'] })).toBe('namespace.part');
    imports.statement('setup(requestedImport);');
    imports.commit();

    expect(magicString.toString()).toContain(`import { requested as requestedImport, namespace } from "library";`);
    expect(magicString.toString()).toContain(
      `import { requested as requestedImport, namespace } from "library";\nsetup(requestedImport);`
    );
  });

  it('shares allocated names between value and type collections', () => {
    const code = `const used = true;`;
    const ast = parseSync('fixture.ts', code).program;
    const magicString = new RolldownMagicString(code);
    const usedNames = new Set(['used']);
    const values = new ModuleImports(ast, magicString, { usedNames });
    const types = new ModuleImports(ast, magicString, { kind: 'type', collisionSuffix: 'Type', usedNames });

    expect(values.reference({ from: 'runtime', name: 'Button' })).toBe('Button');
    expect(types.reference({ from: 'types', name: 'Button' })).toBe('ButtonType');
  });
});
