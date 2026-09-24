import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import { defineComponent, defineSchema } from '../../components/definition';
import { defineComponentTarget, isTargetElement, TARGET_ELEMENT, type TargetElement } from '../definition';
import { jsx } from '../jsx-runtime';

interface PosterProps {
  src?: string | undefined;
}

interface PopoverRootProps {
  open?: boolean | undefined;
}

interface PopoverTriggerProps {
  disabled?: boolean | undefined;
}

interface PopoverPopupProps {
  placement?: 'top' | 'bottom' | undefined;
}

interface SliderThumbnailProps {
  src?: string | undefined;
}

const schema = defineSchema('@fixture/components', {
  Poster: defineComponent<PosterProps>({ name: 'Poster' }),
  Popover: defineComponent({
    name: 'Popover',
    root: 'Root',
    parts: {
      Root: defineComponent<PopoverRootProps>(),
      Trigger: defineComponent<PopoverTriggerProps>(),
      Popup: defineComponent<PopoverPopupProps>(),
    },
  }),
  Slider: defineComponent({
    name: 'Slider',
    root: 'Root',
    parts: {
      Root: defineComponent(),
      Thumbnail: defineComponent({
        root: 'Root',
        parts: {
          Root: defineComponent<SliderThumbnailProps>(),
          Image: defineComponent<{ alt?: string | undefined }>(),
        },
      }),
    },
  }),
});

describe('defineComponentTarget', () => {
  it('binds typed rewrites and structural rules to a component source', () => {
    const Div = createTarget().components.rules.Slider;

    expect(Div).toBeDefined();
  });

  it('creates canonical, imported, and element target references', () => {
    let PosterTarget: TargetElement | undefined;
    let Div: TargetElement | undefined;
    let ImportedPoster: TargetElement | undefined;

    const componentTarget = defineComponentTarget<typeof schema>()(({ target, element, imported }) => {
      PosterTarget = target.Poster;
      Div = element('div');
      ImportedPoster = imported({ from: '@fixture/react', name: 'Poster' });

      return {
        source: '@fixture/components',
        components: {
          resolve: () => ImportedPoster,
          rules: {
            Slider: {
              Root: Div,
              Thumbnail: {
                Root: target.Slider.Thumbnail.Root,
                Image: target.Slider.Thumbnail.Image,
              },
            },
          },
        },
        jsx: { importSource: 'react', attributes: 'react' },
      };
    });

    expect(isTargetElement(PosterTarget)).toBe(true);
    expect(PosterTarget?.[TARGET_ELEMENT]).toEqual({
      kind: 'component',
      component: 'Poster',
      parts: [],
    });
    expect(Div?.[TARGET_ELEMENT]).toEqual({ kind: 'element', tagName: 'div' });
    expect(ImportedPoster?.[TARGET_ELEMENT]).toEqual({
      kind: 'import',
      import: { from: '@fixture/react', name: 'Poster' },
    });
    expect(componentTarget.source).toBe('@fixture/components');
    expect(componentTarget.transforms).toEqual([]);
  });
});

function createTarget() {
  return defineComponentTarget<typeof schema>()(({ target, element, imported }) => {
    const Div = element('div');

    // @ts-expect-error The target namespace only exposes canonical schema components.
    target.Unknown;

    return {
      source: '@fixture/components',
      components: {
        resolve: ({ component, parts }) =>
          imported({
            from: '@fixture/react',
            name: component,
            ...(parts.length > 0 ? { path: parts } : {}),
          }),
        rules: {
          Poster: ({ props, children }) => {
            expectTypeOf(props.src).toEqualTypeOf<string | undefined>();

            return jsx(target.Poster, { ...props, children });
          },
          Popover: ({ props, children, parts, id }) => {
            expectTypeOf(props.open).toEqualTypeOf<boolean | undefined>();
            expectTypeOf(parts.Trigger.props.disabled).toEqualTypeOf<boolean | undefined>();
            expectTypeOf(parts.Popup.one().props.placement).toEqualTypeOf<'top' | 'bottom' | undefined>();

            return jsx(target.Popover.Root, {
              ...props,
              id: id('root'),
              children: [children, parts.Trigger, parts.Popup],
            });
          },
          Slider: {
            Root: Div,
            Thumbnail: ({ props, parts }) => {
              expectTypeOf(props.src).toEqualTypeOf<string | undefined>();
              expectTypeOf(parts.Image.props.alt).toEqualTypeOf<string | undefined>();

              return jsx(target.Slider.Thumbnail.Root, {
                ...props,
                children: parts.Image,
              });
            },
          },
        },
      },
      jsx: { importSource: 'react', attributes: 'react' },
    };
  });
}
