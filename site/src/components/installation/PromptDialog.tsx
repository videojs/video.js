import { Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import { useImperativeHandle, useRef, useState, type ComponentType, type Ref, type RefObject } from 'react';

import Pen from '@/assets/icons/pen.svg?react';
import X from '@/assets/icons/x.svg?react';

import type { PromptOption } from './promptPresentation';

const SIZE_CLASSES = { md: 'max-w-xl', lg: 'max-w-3xl' } as const;

interface Props<BodyProps extends object> {
  /** What the choice sets, such as `Skin`, which names the trigger. */
  name: string;
  value: PromptOption;
  /** Classes for the trigger, which reads like the form's other controls. */
  className?: string;
  title: string;
  description: string;
  /** The element to focus when the dialog opens, such as the selected card. */
  focusSelector: string;
  size?: keyof typeof SIZE_CLASSES;
  /**
   * Load the dialog's content. It is heavy and most readers never open the dialog, so it loads when the reader points
   * at or focuses the value, and the dialog opens once it is in place instead of filling in afterwards.
   */
  loadBody: () => Promise<{ default: ComponentType<BodyProps> }>;
  bodyProps: BodyProps;
  /** Keep the content mounted while the dialog is closed, so work such as an upload keeps going. */
  keepMounted?: boolean;
  /** Open the dialog from elsewhere, such as a menu item or a link that offers an upload. */
  actionsRef?: Ref<PromptDialogActions>;
  /** Render the form control that opens the dialog; without it, only `actionsRef` does. */
  showTrigger?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where focus goes on closing, when something other than the trigger opened the dialog. */
  finalFocus?: RefObject<HTMLElement | null> | undefined;
}

export interface PromptDialogActions {
  /**
   * Open the dialog once its content is in place, as a click on the trigger does, focusing `focusSelector` if given
   * instead of the dialog's own.
   */
  open: (focusSelector?: string) => void;
  /** Start loading the content, such as when the reader points at something that opens the dialog. */
  preload: () => void;
}

/** A choice that needs more room than a select, such as cards with a preview, opened in a dialog from a form control. */
export default function PromptDialog<BodyProps extends object>({
  name,
  value,
  className,
  title,
  description,
  focusSelector,
  size = 'md',
  loadBody,
  bodyProps,
  keepMounted = false,
  actionsRef,
  showTrigger = true,
  onOpenChange,
  finalFocus,
}: Props<BodyProps>) {
  const [open, setOpenState] = useState(false);
  const [Body, setBody] = useState<ComponentType<BodyProps> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const loading = useRef<Promise<void> | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const focusOverride = useRef<string | undefined>(undefined);

  function load(): Promise<void> {
    if (loading.current) return loading.current;

    const attempt = loadBody().then((module) => {
      setBody(() => module.default);
      setLoadFailed(false);
    });

    // Forget a failed attempt so the next hover or click tries again.
    attempt.catch(() => {
      loading.current = null;
    });
    loading.current = attempt;

    return attempt;
  }

  function preload() {
    load().catch(() => {});
  }

  function setOpen(next: boolean) {
    setOpenState(next);
    onOpenChange?.(next);
  }

  function show(focus?: string) {
    focusOverride.current = focus;
    load().then(
      () => setOpen(true),
      () => {
        setLoadFailed(true);
        setOpen(true);
      }
    );
  }

  useImperativeHandle(actionsRef, () => ({ open: show, preload }));

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) show();
        else setOpen(false);
      }}
    >
      {showTrigger && (
        <Dialog.Trigger
          aria-label={`${name}: ${value.label}`}
          title={value.label}
          className={className}
          onPointerEnter={preload}
          onPointerDown={preload}
          onFocus={preload}
        >
          <span aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center">
            {value.icon}
          </span>
          <span className="min-w-0 flex-1 truncate text-left">{value.label}</span>
          {/* An edit mark rather than a chevron: the choice opens a dialog, not a list. */}
          <Pen className="text-muted size-3.5 shrink-0" aria-hidden="true" />
        </Dialog.Trigger>
      )}
      <Dialog.Portal keepMounted={keepMounted && Body !== null}>
        <Dialog.Backdrop className="bg-faded-black/40 starting-style:opacity-0 ending-style:opacity-0 fixed inset-0 z-50 transition-opacity duration-150 motion-reduce:transition-none" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <Dialog.Popup
            ref={popupRef}
            initialFocus={() =>
              popupRef.current?.querySelector<HTMLElement>(focusOverride.current ?? focusSelector) ?? true
            }
            {...(finalFocus && { finalFocus })}
            className={clsx(
              'corner-squircle border-line bg-surface-raised dark:bg-soot relative w-full rounded-xl border p-6 shadow-lg',
              'transition duration-150 ease-out starting-style:scale-95 starting-style:opacity-0 ending-style:scale-95 ending-style:opacity-0',
              'motion-reduce:transition-none',
              SIZE_CLASSES[size]
            )}
          >
            <Dialog.Title className="font-display text-h3 pr-10 leading-tight">{title}</Dialog.Title>
            <Dialog.Description className="text-p3 mt-2 mb-6">{description}</Dialog.Description>
            {Body ? (
              <Body {...bodyProps} />
            ) : (
              loadFailed && (
                <p className="text-p3" role="alert">
                  This panel did not load. Close the dialog and try again.
                </p>
              )
            )}
            <Dialog.Close
              aria-label="Close"
              className="corner-squircle intent:bg-hover focus-visible:outline-gold absolute top-4 right-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-1"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
