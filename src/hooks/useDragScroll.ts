import { useEffect } from 'react';

const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, label, [role="button"], [contenteditable="true"]';
const DRAG_THRESHOLD = 4;

type Scroller = { scrollBy: (dy: number) => void };

function findScroller(target: EventTarget | null): Scroller {
  let node = target instanceof Element ? target : null;

  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    const canScrollY =
      (style.overflowY === 'auto' || style.overflowY === 'scroll') && node.scrollHeight > node.clientHeight;
    if (canScrollY) {
      const el = node;
      return { scrollBy: (dy) => (el.scrollTop -= dy) };
    }
    node = node.parentElement;
  }

  return { scrollBy: (dy) => window.scrollBy(0, -dy) };
}

export function useDragScroll() {
  useEffect(() => {
    let isDown = false;
    let dragging = false;
    let startY = 0;
    let lastY = 0;
    let scroller: Scroller | null = null;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (e.target instanceof Element && e.target.closest(INTERACTIVE_SELECTOR)) return;
      isDown = true;
      dragging = false;
      startY = e.clientY;
      lastY = e.clientY;
      scroller = findScroller(e.target);
    };

    const stop = () => {
      isDown = false;
      dragging = false;
      scroller = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown || !scroller) return;

      if (!dragging) {
        if (Math.abs(e.clientY - startY) < DRAG_THRESHOLD) return;
        dragging = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }

      e.preventDefault();
      scroller.scrollBy(e.clientY - lastY);
      lastY = e.clientY;
    };

    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('blur', stop);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('blur', stop);
    };
  }, []);
}
