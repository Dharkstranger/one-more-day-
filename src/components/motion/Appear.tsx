import type { ReactNode } from 'react';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

/** Fades and rises into place. `index` staggers items in a list. */
export function Appear({ children, index = 0, delay = 0 }: { children: ReactNode; index?: number; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <Animated.View entering={reduce ? undefined : FadeInDown.delay(delay + index * 70).duration(480).springify().damping(18)}>
      {children}
    </Animated.View>
  );
}
