import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

// Breathe in 4s, hold 4s, out 6s. Slow out-breaths calm the body.
const PHASES = [
  { label: 'Breathe in', ms: 4000, to: 1 },
  { label: 'Hold', ms: 4000, to: 1 },
  { label: 'Breathe out', ms: 6000, to: 0.55 },
] as const;

export function BreathingCircle({ onCycle }: { onCycle?: (n: number) => void }) {
  const scale = useRef(new Animated.Value(0.55)).current;
  const [phase, setPhase] = useState(0);
  const cycles = useRef(0);

  useEffect(() => {
    const p = PHASES[phase];
    const anim = Animated.timing(scale, { toValue: p.to, duration: p.ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    anim.start(({ finished }) => {
      if (!finished) return;
      const next = (phase + 1) % PHASES.length;
      if (next === 0) {
        cycles.current += 1;
        onCycle?.(cycles.current);
      }
      setPhase(next);
    });
    return () => anim.stop();
  }, [phase, scale, onCycle]);

  return (
    <View className="my-6 h-64 items-center justify-center">
      <Animated.View
        style={{ transform: [{ scale }] }}
        className="absolute h-64 w-64 rounded-full bg-sun/30"
      />
      <Animated.View style={{ transform: [{ scale }] }} className="absolute h-44 w-44 rounded-full bg-sun/70" />
      <Text className="font-display text-2xl text-white">{PHASES[phase].label}</Text>
    </View>
  );
}
