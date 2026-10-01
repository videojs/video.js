/** @jsxImportSource vjsc/target */
/* oxlint-disable react/jsx-key -- Target arrays describe generated siblings, not React reconciliation. */

import type coreSchema from '@videojs/core/vjsc';
import {
  type ComponentRules,
  type ComponentTarget,
  consumeRenderTarget,
  type TargetHelpers,
  defineComponentTarget,
  type TemplateTargetDefinition,
} from 'vjsc/target';
import { Host } from 'vjsc/target/jsx-runtime';

import { htmlIconModule, htmlRenderAliases } from './html-render.ts';

type CoreSchema = typeof coreSchema;

interface ComponentPartNameMap {
  readonly [component: string]: Readonly<Record<string, string>>;
}

interface PublicNameMap {
  readonly [component: string]: string;
}

const componentParts: ComponentPartNameMap = {
  Controls: {
    Root: 'Controls',
    Backdrop: 'ControlsBackdrop',
    Content: 'ControlsContent',
    Group: 'ControlsGroup',
  },
  ErrorDialog: {
    Root: 'ErrorDialog',
    Backdrop: 'DialogBackdrop',
    Popup: 'DialogPopup',
    Title: 'DialogTitle',
    Description: 'DialogDescription',
    Close: 'DialogClose',
  },
  AudioTrackRadioGroup: {
    Options: 'AudioTrackRadioGroup',
  },
  CaptionsRadioGroup: {
    Options: 'CaptionsRadioGroup',
  },
  Menu: {
    Root: 'Menu',
    Trigger: 'MenuItem',
    Popup: 'Menu',
    Content: 'MenuContent',
    Group: 'MenuGroup',
    GroupLabel: 'MenuGroupLabel',
    Item: 'MenuItem',
    ItemIndicator: 'MenuItemIndicator',
    RadioGroup: 'MenuRadioGroup',
    RadioItem: 'MenuRadioItem',
    Separator: 'MenuSeparator',
    CheckboxItem: 'MenuCheckboxItem',
  },
  Popover: {
    Root: 'Popover',
    Trigger: 'Popover',
    Popup: 'Popover',
    Arrow: 'Popover',
  },
  Poster: {
    Root: 'Poster',
  },
  PlaybackRateRadioGroup: {
    Options: 'PlaybackRateRadioGroup',
  },
  QualityRadioGroup: {
    Options: 'QualityRadioGroup',
  },
  SeekIndicator: {
    Root: 'SeekIndicator',
    Value: 'SeekIndicatorValue',
  },
  Slider: {
    Root: 'Slider',
    Track: 'SliderTrack',
    Fill: 'SliderFill',
    Buffer: 'SliderBuffer',
    Thumb: 'SliderThumb',
    'Thumbnail.Root': 'SliderThumbnail',
    Preview: 'SliderPreview',
    Value: 'SliderValue',
  },
  Thumbnail: {
    Root: 'Thumbnail',
  },
  StatusIndicator: {
    Root: 'StatusIndicator',
    Value: 'StatusIndicatorValue',
  },
  Time: {
    Group: 'TimeGroup',
    Separator: 'TimeSeparator',
    Value: 'Time',
  },
  TimeSlider: {
    Root: 'TimeSlider',
    Track: 'SliderTrack',
    Fill: 'SliderFill',
    Buffer: 'SliderBuffer',
    Thumb: 'SliderThumb',
    Chapters: 'TimeSliderChapters',
    ChapterTitle: 'TimeSliderChapterTitle',
    Preview: 'SliderPreview',
    Value: 'SliderValue',
  },
  Tooltip: {
    Provider: 'TooltipGroup',
    Root: 'Tooltip',
    Trigger: 'Tooltip',
    Popup: 'Tooltip',
    Arrow: 'Tooltip',
    Label: 'TooltipLabel',
    Shortcut: 'TooltipShortcut',
  },
  VolumeIndicator: {
    Root: 'VolumeIndicator',
    Fill: 'VolumeIndicatorFill',
    Value: 'VolumeIndicatorValue',
  },
  VolumePopover: {
    Root: 'VolumePopover',
    Trigger: 'VolumePopover',
    Popup: 'VolumePopover',
  },
  VolumeSlider: {
    Root: 'VolumeSlider',
    Track: 'SliderTrack',
    Fill: 'SliderFill',
    Thumb: 'SliderThumb',
    Preview: 'SliderPreview',
    Value: 'SliderValue',
  },
};

const publicNames: PublicNameMap = {
  AirPlayButton: 'airplay-button',
  PiPButton: 'pip-button',
};

export const htmlComponentTarget: ComponentTarget<CoreSchema> = defineComponentTarget<CoreSchema>()(({
  target,
  element,
  unwrap,
}) => {
  const Button = element('button');
  const Div = element('div');
  const Img = element('img');
  const Slot = element('slot');
  const Span = element('span');
  const Sup = element('sup');
  const HtmlTemplate = element('template');
  const I18nText = element('media-text', {
    import: { from: '@videojs/html/i18n', sideEffect: true },
  });

  // Both thumbnail elements adopt a light-DOM image and fill in its source, so the part is a plain `img`.
  const thumbnailImage = ({ props }: { props: object }) => (
    <Img alt="" aria-hidden="true" decoding="async" {...props} />
  );

  const optionTemplate: TemplateTargetDefinition = {
    render: ({ children }) => <HtmlTemplate>{children}</HtmlTemplate>,
    parts: {
      label: ({ props }) => <Span data-part="label" {...props} />,
    },
  };

  return {
    source: '@videojs/core/vjsc',
    components: {
      resolve: ({ component, part }) => {
        const name = part
          ? componentParts[component]?.[part]
          : component === 'Container'
            ? 'MediaContainer'
            : component;

        return name ? htmlElementTarget(name, element) : undefined;
      },
      rules: {
        AudioTrackRadioGroup: {
          Root: unwrap(),
          Value: ({ props }) => <Span data-part="value" {...props} />,
        },
        CaptionsRadioGroup: {
          Root: unwrap(),
          Value: ({ props }) => <Span data-part="value" {...props} />,
        },
        Menu: ({ props, parts, id }) => {
          const popup = parts.Popup?.one();
          const trigger = parts.Trigger.one();
          const controlledId = id(popup ? 'popup' : 'content');

          if (popup) {
            const componentProps = consumeRenderTarget(trigger.props);

            return [
              trigger.replaceWith(
                componentProps ? (
                  <Host commandfor={controlledId} {...componentProps}>
                    {trigger.children}
                  </Host>
                ) : (
                  <Button commandfor={controlledId} {...trigger.props}>
                    {trigger.children}
                  </Button>
                )
              ),
              popup.replaceWith(
                <target.Menu.Popup id={controlledId} {...props.merge(popup.props.omit('keepMounted'))}>
                  {popup.children}
                </target.Menu.Popup>
              ),
            ];
          }

          const content = parts.Content.one();

          return [
            trigger.replaceWith(
              <target.Menu.Item commandfor={controlledId} {...trigger.props}>
                {trigger.children}
              </target.Menu.Item>
            ),
            content.replaceWith(
              <target.Menu.Content id={controlledId} {...content.props}>
                {content.children}
              </target.Menu.Content>
            ),
          ];
        },
        Popover: ({ props, parts }) => [
          parts.Trigger.children,
          <target.Popover.Popup {...props.merge(parts.Popup.props)}>{parts.Popup.children}</target.Popover.Popup>,
        ],
        VolumePopover: ({ props, parts, id }) => {
          const popup = id('popup');
          const trigger = parts.Trigger.one();

          return [
            trigger.replaceWith(
              <Host commandfor={popup} {...trigger.props}>
                {trigger.children}
              </Host>
            ),
            <target.VolumePopover.Popup id={popup} {...props.merge(parts.Popup.props)}>
              {parts.Popup.children}
            </target.VolumePopover.Popup>,
          ];
        },
        Poster: {
          Image: ({ props }) => <Img alt="" decoding="async" {...props} />,
        },
        PlaybackRateRadioGroup: {
          Root: unwrap(),
          Value: ({ props }) => <Span data-part="value" {...props} />,
        },
        QualityRadioGroup: {
          Root: unwrap(),
          Value: ({ props }) => <Span data-part="value" {...props} />,
        },
        Slider: {
          Thumbnail: {
            Image: thumbnailImage,
          },
        },
        Thumbnail: {
          Image: thumbnailImage,
        },
        Tooltip: ({ props, parts, id }) => {
          const trigger = id('trigger');

          return [
            <Host id={trigger}>{parts.Trigger.children}</Host>,
            <target.Tooltip.Popup trigger={trigger} {...props.merge(parts.Popup.props)}>
              {parts.Popup.children}
            </target.Tooltip.Popup>,
          ];
        },
      } satisfies ComponentRules<CoreSchema['definitions']>,
    },
    primitives: {
      Box: Div,
      Slot,
      Text: ({ props, children }) =>
        props.has('token') ? <I18nText {...props}>{children}</I18nText> : <Span {...props}>{children}</Span>,
      Template: {
        chapter: {
          render: ({ props, children }) => (
            <HtmlTemplate>
              <Div {...props}>{children}</Div>
            </HtmlTemplate>
          ),
        },
        'quality-option': {
          ...optionTemplate,
          parts: {
            ...optionTemplate.parts,
            tier: ({ props }) => <Sup data-part="tier" {...props} />,
            badge: ({ props }) => <Span data-part="badge" {...props} />,
          },
        },
        'audio-track-option': optionTemplate,
        'playback-rate-option': optionTemplate,
        'captions-option': optionTemplate,
      },
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
      importSource: 'vjsc/html-runtime',
      attributes: 'html',
      host: { from: 'vjsc/html-runtime/jsx-runtime', name: 'Host' },
      scope: { from: 'vjsc/html-runtime/jsx-runtime', name: 'Scope' },
    },
    render: {
      aliases: htmlRenderAliases,
      // Element registrations, the authoring runtime, and generated stylesheets have no effect on static markup.
      empty: (specifier) =>
        specifier.startsWith('@videojs/html/ui/') ||
        specifier === '@videojs/html/i18n' ||
        specifier === 'vjsc/components' ||
        specifier.startsWith('virtual:vjsc/css/'),
      modules: (modules) => {
        const icons = htmlIconModule(modules);

        return new Map([
          ['@videojs/html/icons', icons],
          ['@videojs/html/icons/neutral', icons],
        ]);
      },
    },
  };
});

function htmlElementTarget(name: string, element: TargetHelpers<CoreSchema>['element']) {
  const publicName = publicNames[name] ?? kebabCase(name === 'MediaContainer' ? 'container' : name);
  const source = `@videojs/html/ui/${publicName}`;

  return element(`media-${publicName}`, { import: { from: source, sideEffect: true } });
}

function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
