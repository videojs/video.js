import { useRef, useState } from 'react';

import Check from '@/assets/icons/check.svg?react';
import { ANALYTICS_EVENTS, isAgentHandoffMethod, trackEvent } from '@/utils/analytics-events';
import useIsHydrated from '@/utils/useIsHydrated';

/** What a successful copy reports. Plain data, so Astro pages can pass it to the island. */
export interface CopyAnalytics {
  /** A short, stable name for the copied block, such as `cdn-scripts`. */
  block: string;
}

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
  /**
   * PostHog `cta` autocapture property for the button. A handoff CTA, such as `copy-agent-prompt`, also reports an
   * `agent_handoff` event when the copy succeeds.
   */
  cta?: string;
  analytics?: CopyAnalytics;
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
  analytics,
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
      let tab: string | undefined;

      if (buttonRef.current) {
        // Find the closest container
        const container = buttonRef.current.closest(copyFrom.container);

        if (container) {
          // Find the target within that container
          const target = container.querySelector(copyFrom.target);

          if (target) {
            text = getCopyText(target);

            // Only a real choice is worth reporting: a single-tab code frame always reads `code`. Tabs render their value
            // as `data-value`, since their text can repeat the label for layout.
            if (container.querySelectorAll('[role="tab"]').length > 1) {
              tab = container.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.dataset.value;
            }
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

        if (analytics) {
          trackEvent(ANALYTICS_EVENTS.codeCopied, tab ? { block: analytics.block, tab } : { block: analytics.block });
        }

        if (isAgentHandoffMethod(cta)) trackEvent(ANALYTICS_EVENTS.agentHandoff, { method: cta });

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
