import { useLayoutEffect, useRef } from 'react';
import { useMediaQuery } from './use-media-query';

// Animate where an item moved, without delaying the underlying state change.
export function useListMotion(order: string) {
  const container = useRef<HTMLDivElement>(null);
  const previous = useRef(new Map<string, number>());
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  useLayoutEffect(() => {
    const positions = new Map<string, number>();
    const animations: Animation[] = [];
    container.current?.querySelectorAll<HTMLElement>('[data-motion-key]').forEach((element) => {
      const key = element.dataset.motionKey!;
      const top = element.offsetTop;
      const oldTop = previous.current.get(key);
      positions.set(key, top);
      if (!reducedMotion && oldTop !== undefined && Math.abs(oldTop - top) > 1) {
        animations.push(
          element.animate(
            [{ transform: `translateY(${oldTop - top}px)` }, { transform: 'translateY(0)' }],
            { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
          ),
        );
      }
    });
    previous.current = positions;
    return () => animations.forEach((animation) => animation.cancel());
  }, [order, reducedMotion]);
  return container;
}
