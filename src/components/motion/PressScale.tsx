import type { ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

interface Props extends Omit<PressableProps, 'children'> {
  children: ReactNode;
  className?: string;
  /** How far it shrinks when pressed. */
  depth?: number;
}

/**
 * A Pressable that gives a soft squeeze under the finger.
 * The animated wrapper only scales; NativeWind classes go on the inner Pressable,
 * because className doesn't apply to Reanimated components.
 */
export function PressScale({ children, depth = 0.96, onPressIn, onPressOut, className, ...rest }: Props) {
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    // Let the wrapper grow when the button is meant to fill a row.
    <Animated.View style={[/\bflex-1\b/.test(className ?? '') ? { flex: 1 } : null, animated]}>
      <Pressable
        {...rest}
        className={className}
        onPressIn={(e) => {
          if (!reduce) scale.value = withSpring(depth, { damping: 15, stiffness: 400 });
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, { damping: 12, stiffness: 300 });
          onPressOut?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
