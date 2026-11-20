/**
 * Mock element mixin — mirrors `MuxVideoMixin`.
 *
 * Exercises: attributes an element observes itself, outside `CustomMediaElement`'s `static properties`. `poster-at` is
 * described by an `@attribute` tag with a type, `flavor-hint` has no tag, and `src` is already a standard attribute.
 */
export function FlavorVideoMixin<Class extends new (...args: any[]) => HTMLElement>(BaseClass: Class): Class {
  class FlavorVideoElement extends BaseClass {
    /**
     * @attribute {number} poster-at - Video time the poster is taken from. Sets
     *   `source.poster.time`.
     */
    static get observedAttributes(): string[] {
      const inherited = (BaseClass as unknown as { observedAttributes?: string[] }).observedAttributes ?? [];

      return [...inherited, 'poster-at', 'flavor-hint', 'src'];
    }
  }

  return FlavorVideoElement;
}
