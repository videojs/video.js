/** @jsxImportSource vjsc/target */
/* oxlint-disable react/jsx-key -- Target arrays describe generated siblings, not React reconciliation. */

import type coreSchema from '@videojs/core/vjsc';
import {
  type ComponentRules,
  type ComponentTarget,
  consumeRenderTarget,
  type TargetHelpers,
  defineComponentTarget,
  htmlJsx,
  type TemplateTargetDefinition,
} from 'vjsc/target';
import { Host } from 'vjsc/target/jsx-runtime';

import { htmlElementModule, htmlElementName, htmlI18nModule, htmlPublicName } from '../../../html/vjsc/elements.ts';
import { skinRenderTargets } from './render-targets.ts';

type CoreSchema = typeof coreSchema;

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
    import: { from: htmlI18nModule, sideEffect: true },
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
      resolve: ({ component, parts }) => {
        const name = htmlElementName(component, parts);

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
    renderTargets: skinRenderTargets({ button: Button, div: Div }),
    jsx: htmlJsx,
  };
});

function htmlElementTarget(name: string, element: TargetHelpers<CoreSchema>['element']) {
  const publicName = htmlPublicName(name);

  return element(`media-${publicName}`, { import: { from: htmlElementModule(publicName), sideEffect: true } });
}
