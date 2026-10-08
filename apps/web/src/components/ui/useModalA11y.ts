'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard behaviour every modal needs: focus moves into the dialog when it opens, Tab/Shift+Tab
 * cycle inside it, Escape closes it, and focus returns to the trigger when it closes.
 * Pair with role="dialog" aria-modal="true" aria-labelledby on the dialog element.
 *
 *   const ref = useModalA11y<HTMLDivElement>(open, onClose);
 *   <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="x-title">…</div>
 *
 * Returns a callback ref so it also works when the dialog mounts a render later (e.g. via a portal).
 */
export function useModalA11y<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const [node, setNode] = useState<T | null>(null);
  const ref = useCallback((el: T | null) => setNode(el), []);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || !node) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);

    // Prefer the first form field over the close button so keyboard users land on the content.
    if (!node.contains(document.activeElement)) {
      const initial = focusables().find((el) => el.matches('input, select, textarea')) ?? focusables()[0];
      if (initial) initial.focus();
      else {
        node.tabIndex = -1;
        node.focus();
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !node.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !node.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, [open, node]);

  return ref;
}
