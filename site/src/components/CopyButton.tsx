import { useRef, useState } from 'react';

import Check from '@/assets/icons/check.svg?react';
import useIsHydrated from '@/utils/useIsHydrated';

export interface CopyButtonProps {
  children: React.ReactNode;
  copied?: React.ReactNode; // Optional, passed via slot="copied" in Astro
  copiedCheck?: boolean;
  copyFrom: {
    container: string; // CSS selector for parent container (e.g., 'starlight-tabs')
    target: string; // CSS selector for content element (e.g., '[role="tabpanel"]:not([hidden])')
  };
  className?: string;
  style?: React.CSSProperties;
  timeout?: number;
  /** PostHog `cta` autocapture property for the button. */
  cta?: string;
}

/** Read the target's text without UI chrome such as a code frame's "Show more" control. */
function getCopyText(target: Element): string {
  // SAFETY: cloning an Element yields an Element of the same type.
  const clone = target.cloneNode(true) as Element;

  clone.querySelectorAll('[data-copy-ignore]').forEach((node) => node.remove());

  return clone.textContent || '';
}

export default function CopyButton({
  children,
  copied,
  copiedCheck = false,
  copyFrom,
  className,
  style,
  timeout = 2000,
  cta,
}: CopyButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const isHydrated = useIsHydrated();

  const disabled = !isHydrated;
  const copiedContent = copiedCheck ? (
    <span className="inline-flex items-center gap-1.5">
      <Check className="size-4" aria-hidden="true" />
      {copied || children}
    </span>
  ) : (
    copied || children
  );

  const handleCopy = async () => {
    try {
      let text = '';

      if (buttonRef.current) {
        // Find the closest container
        const container = buttonRef.current.closest(copyFrom.container);

        if (container) {
          // Find the target within that container
          const target = container.querySelector(copyFrom.target);

          if (target) {
            text = getCopyText(target);
          } else {
            console.warn(
              `CopyButton: No target found for selector "${copyFrom.target}" within container "${copyFrom.container}"`
            );
          }
        } else {
          console.warn(`CopyButton: No container found for selector "${copyFrom.container}"`);
        }
      } else {
        console.warn('CopyButton: buttonRef is null');
      }

      if (text) {
        await navigator.clipboard.writeText(text.trim());
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, timeout);
      }
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleCopy}
        className={className}
        style={style}
        aria-label={isCopied ? 'Copied' : 'Copy to clipboard'}
        data-ph-capture-attribute-cta={cta}
      >
        {isCopied ? copiedContent : children}
      </button>
      <span aria-live="polite" className="sr-only">
        {isCopied ? 'Copied' : ''}
      </span>
    </>
  );
}
