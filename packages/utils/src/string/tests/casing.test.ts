import { describe, expect, it } from 'vite-plus/test';

import { camelCase, kebabCase, kebabCaseName, pascalCase, snakeCase } from '../casing';

describe('casing', () => {
  describe('pascalCase', () => {
    it('converts simple strings', () => {
      expect(pascalCase('hello')).toBe('Hello');
    });

    it('converts kebab-case', () => {
      expect(pascalCase('hello-world')).toBe('HelloWorld');
    });

    it('converts snake_case', () => {
      expect(pascalCase('hello_world')).toBe('HelloWorld');
    });

    it('converts mixed case', () => {
      expect(pascalCase('hello-World')).toBe('HelloWorld');
    });

    it('handles already pascal case', () => {
      expect(pascalCase('HelloWorld')).toBe('HelloWorld');
    });
  });

  describe('camelCase', () => {
    it('converts simple strings', () => {
      expect(camelCase('hello')).toBe('hello');
    });

    it('converts pascal case', () => {
      expect(camelCase('HelloWorld')).toBe('helloWorld');
    });

    it('converts kebab-case', () => {
      expect(camelCase('hello-world')).toBe('helloWorld');
    });

    it('converts snake_case', () => {
      expect(camelCase('hello_world')).toBe('helloWorld');
    });
  });

  describe('snakeCase', () => {
    it('converts camelCase', () => {
      expect(snakeCase('assetStartTime')).toBe('asset_start_time');
    });

    it('preserves lowercase', () => {
      expect(snakeCase('token')).toBe('token');
    });
  });

  describe('kebabCase', () => {
    it('converts camelCase', () => {
      expect(kebabCase('positionAnchor')).toBe('position-anchor');
    });

    it('converts PascalCase', () => {
      expect(kebabCase('PositionAnchor')).toBe('-position-anchor');
    });

    it('preserves lowercase', () => {
      expect(kebabCase('margin')).toBe('margin');
    });

    it('does not special-case CSS custom properties', () => {
      expect(kebabCase('--media-popover-offset')).toBe('--media-popover-offset');
    });
  });

  describe('kebabCaseName', () => {
    it('converts PascalCase and camelCase identifiers without a leading dash', () => {
      expect(kebabCaseName('PlayButton')).toBe('play-button');
      expect(kebabCaseName('playButton')).toBe('play-button');
      expect(kebabCaseName('PiP2Button')).toBe('pi-p2-button');
    });

    it('preserves lowercase and kebab-case names', () => {
      expect(kebabCaseName('button')).toBe('button');
      expect(kebabCaseName('play-button')).toBe('play-button');
    });
  });
});
