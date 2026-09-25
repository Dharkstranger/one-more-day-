import { useEffect, useRef, useState } from 'react';
import { Text, type TextProps } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/** A number that counts up to its value, easing out. */
export function CountUp({ value, duration = 900, ...text }: { value: number; duration?: number } & TextProps) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduce) return setShown(value);
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(origin + (value - origin) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduce]);

  return <Text {...text}>{shown}</Text>;
}
