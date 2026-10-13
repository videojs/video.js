/** @jsxImportSource vjsc/target */

import type coreSchema from '@videojs/core/vjsc';
import {
  type ComponentRules,
  type ComponentTarget,
  defineComponentTarget,
  type TemplateTargetDefinition,
} from 'vjsc/target';
import { Host } from 'vjsc/target/jsx-runtime';

type CoreSchema = typeof coreSchema;

const componentSources = {
  AudioTrackRadioGroup: '@videojs/react/ui/audio-track-radio-group',
  CaptionsRadioGroup: '@videojs/react/ui/captions-radio-group',
  PlaybackRateRadioGroup: '@videojs/react/ui/playback-rate-radio-group',
  QualityRadioGroup: '@videojs/react/ui/quality-radio-group',
} as const satisfies Partial<Record<keyof CoreSchema['definitions'], string>>;

export const reactComponentTarget: ComponentTarget<CoreSchema> = defineComponentTarget<CoreSchema>()(({
  target,
  code,
  element,
  imported,
}) => {
  const Button = element('button', {
    props: {
      from: 'react',
      name: 'ComponentProps',
      intrinsic: 'button',
    },
  });
  const Div = element('div', {
    props: {
      from: 'react',
      name: 'ComponentProps',
      intrinsic: 'div',
    },
  });
  const Span = element('span');
  const Sup = element('sup');
  const I18nText = imported({ from: '@videojs/react', name: 'Text' });
  const renderProps = code.param<{ children: unknown }>('props');
  const item = code.param<{ badge?: unknown; label: unknown; tier?: unknown }>('item');
  const optionTemplate: TemplateTargetDefinition = {
    render: ({ children }) => <Host renderItem={code.fn([renderProps, item], code.withProps(children, renderProps))} />,
    parts: {
      label: ({ props }) => <Span {...props}>{item.label}</Span>,
    },
  };

  // Image parts take their authored children as the `render` override, so a skin can draw its own image.
  const rendersImageChildren = (component: string, path: readonly string[]) =>
    path.at(-1) === 'Image' && (component === 'Poster' || component === 'Slider' || component === 'Thumbnail');

  return {
    source: '@videojs/core/vjsc',
    components: {
      resolve: ({ component, part }) => {
        const path = part ? part.split('.') : [];
        const propsPath = path.length === 0 ? ['Props'] : [...path.slice(0, -1), `${path.at(-1)}Props`];
        const source = componentSources[component as keyof typeof componentSources] ?? '@videojs/react';

        return imported({
          from: source,
          name: component,
          path: path.length > 0 ? path : undefined,
          props: {
            from: source,
            name: component,
            path: propsPath,
            children: rendersImageChildren(component, path) ? 'render' : undefined,
          },
        });
      },
      rules: {
        Controls: {
          Root: ({ props, children }) => <target.Controls.Root {...props}>{children}</target.Controls.Root>,
        },
        ErrorDialog: {
          Root: ({ children }) => <target.ErrorDialog.Root>{children}</target.ErrorDialog.Root>,
        },
        Menu: {
          Trigger: ({ props, children }) => <target.Menu.Trigger {...props}>{children}</target.Menu.Trigger>,
        },
        Popover: {
          Trigger: ({ props, children }) => <target.Popover.Trigger render={children} {...props} />,
        },
        VolumePopover: {
          Trigger: ({ props, children }) => <target.VolumePopover.Trigger render={children} {...props} />,
        },
        Poster: {
          Image: ({ props, children }) => <target.Poster.Image render={children} {...props} />,
        },
        Slider: {
          Thumbnail: {
            Image: ({ props, children }) => <target.Slider.Thumbnail.Image render={children} {...props} />,
          },
        },
        Thumbnail: {
          Image: ({ props, children }) => <target.Thumbnail.Image render={children} {...props} />,
        },
        Tooltip: {
          Trigger: ({ props, children }) => <target.Tooltip.Trigger render={children} {...props} />,
        },
      } satisfies ComponentRules<CoreSchema['definitions']>,
    },
    primitives: {
      Box: Div,
      Slot: ({ children }) => children,
      Text: ({ props, children }) =>
        props.has('token') ? <I18nText {...props}>{children}</I18nText> : <Span {...props}>{children}</Span>,
      Template: {
        chapter: {
          render: ({ props, children }) => (
            <Host
              renderChapter={code.fn(
                [renderProps],
                <Div {...props} {...renderProps}>
                  {children}
                </Div>
              )}
            />
          ),
        },
        'quality-option': {
          ...optionTemplate,
          parts: {
            ...optionTemplate.parts,
            tier: ({ props }) => code.when(item.tier, <Sup {...props}>{item.tier}</Sup>),
            badge: ({ props }) => code.when(item.badge, <Span {...props}>{item.badge}</Span>),
          },
        },
        'audio-track-option': optionTemplate,
        'playback-rate-option': optionTemplate,
        'captions-option': optionTemplate,
      },
    },
    types: {
      ClassNameValue: { from: 'cn', name: 'ClassValue' },
      PropsOf: { from: 'react', name: 'ComponentProps' },
      VjscNode: { from: 'react', name: 'ReactNode' },
      VjscElement: { from: 'react', name: 'ReactElement' },
    },
    renderTargets: {
      Button: { element: Button },
      CaptionsButton: { component: true },
      PlaybackRateButton: { component: true },
      SliderBuffer: { element: Div },
      SliderFill: { element: Div },
      SliderThumb: { element: Div },
      SliderTrack: { element: Div },
    },
    jsx: {
      importSource: 'react',
      attributes: 'react',
      className: {
        merge: { from: '@videojs/utils/style', name: 'cn' },
        resolve: { from: '@videojs/utils/style', name: 'resolveClassName' },
        // Every React UI component accepts a state callback for `className` except the plain Container.
        stateAware: ({ source, imported }) => source === '@videojs/react' && imported !== 'Container',
      },
    },
  };
});
