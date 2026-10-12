import { kebabCaseName } from '@videojs/utils/string';

/** Element class names by canonical component and part, such as `Menu.Content` to `MenuContent`. */
export interface HtmlComponentParts {
  readonly [component: string]: Readonly<Record<string, string>>;
}

/**
 * How the canonical VJSC component schema maps onto the custom elements this package defines. Compiler targets that
 * emit HTML skins resolve every canonical component and part through these names, and the colocated test pins each one
 * to a module under `src/define/ui`.
 */
export const htmlComponentParts: HtmlComponentParts = {
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

const publicNames: Readonly<Record<string, string>> = {
  AirPlayButton: 'airplay-button',
  PiPButton: 'pip-button',
};

/** The element class that implements a canonical component or part, if this package defines one. */
export function htmlElementName(component: string, parts: readonly string[] = []): string | undefined {
  if (parts.length > 0) return htmlComponentParts[component]?.[parts.join('.')];

  return component === 'Container' ? 'MediaContainer' : component;
}

/** The public name an element class registers under, such as `play-button` for `PlayButton`. */
export function htmlPublicName(name: string): string {
  return publicNames[name] ?? kebabCaseName(name === 'MediaContainer' ? 'container' : name);
}

const HTML_PACKAGE = '@videojs/html';

/** The side-effect module that registers the locale text element and its default messages. */
export const htmlI18nModule = `${HTML_PACKAGE}/i18n`;

/** The side-effect module that registers one element, such as `@videojs/html/ui/play-button`. */
export function htmlElementModule(publicName: string): string {
  return `${HTML_PACKAGE}/ui/${publicName}`;
}

/** Whether a module only registers elements or locale text, so importing it has no effect outside a browser. */
export function isHtmlRegistrationModule(specifier: string): boolean {
  return specifier.startsWith(`${HTML_PACKAGE}/ui/`) || specifier === htmlI18nModule;
}

/**
 * The module under `packages/html/src` that code generated into this package imports in place of a public one: element
 * and locale registrations come from `define/`, and icon families from `icons/`.
 */
export function htmlPackageModule(specifier: string): string {
  const path = specifier.startsWith(`${HTML_PACKAGE}/`) ? specifier.slice(HTML_PACKAGE.length + 1) : undefined;
  if (path?.startsWith('ui/') || path === 'i18n') return `define/${path}`;

  if (path === 'icons' || path?.startsWith('icons/')) return path;

  throw new Error(`\`${specifier}\` has no module generated package code can import.`);
}
