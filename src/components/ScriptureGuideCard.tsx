import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { copy } from '../copy/en';
import { useScriptureGuide, type GuideInput } from '../hooks/useScriptureGuide';
import { Appear } from './motion/Appear';
import { PressScale } from './motion/PressScale';
import { Label } from './ui/Text';

/** Asks the Scripture Guide for this moment and walks the person through the passage. */
export function ScriptureGuideCard({ input }: { input: GuideInput }) {
  const { state, another } = useScriptureGuide(input);

  if (state.status === 'loading') return <Searching />;

  const g = state.guidance;
  const rtl = g.textLanguage === 'he';
  return (
    <View className="mb-4 overflow-hidden rounded-[28px] bg-night/45 p-5">
      <Label light>{copy.guide.title}</Label>

      <Appear>
        <Text
          className="mt-3 font-display text-lg leading-7 text-white"
          style={rtl ? { writingDirection: 'rtl', textAlign: 'right', fontFamily: undefined, fontSize: 22 } : undefined}
        >
          “{g.text.replace(/^[“"«]|[”"»]$/g, '')}”
        </Text>
        <Text className="mt-2 font-body-bold text-sm text-sun">{g.reference.display}</Text>
        {g.fallbackNote ? <Text className="mt-1 font-body text-xs text-white/60">{g.fallbackNote}</Text> : null}
      </Appear>

      {state.status === 'ready' ? (
        <>
          <Section index={1} label={copy.guide.why} body={g.why} />
          <Section index={2} label={copy.guide.sitWith} body={g.question} emphasis />
          <Section index={3} label={copy.guide.pray} body={g.prayer} italic />
          <Section index={4} label={copy.guide.nextStep} body={g.nextStep} />
          <Appear index={5}>
            <Text className="mt-4 font-body-semi text-sm text-white/80">📖 {copy.guide.readToday(g.readToday.display)}</Text>
          </Appear>
        </>
      ) : (
        <>
          <Text className="mt-4 font-body-semi text-sm text-white/80">📖 {copy.guide.readToday(g.readToday.display)}</Text>
          <Text className="mt-3 font-body text-xs text-white/60">{copy.guide.offline}</Text>
        </>
      )}

      <PressScale onPress={another} accessibilityRole="button" className="mt-5 self-start rounded-full border border-white/25 px-4 py-2">
        <Text className="font-body-bold text-sm text-white">↻ {copy.guide.another}</Text>
      </PressScale>
    </View>
  );
}

function Section({ index, label, body, emphasis, italic }: { index: number; label: string; body: string; emphasis?: boolean; italic?: boolean }) {
  if (!body) return null;
  return (
    <Appear index={index} delay={200}>
      <View className="mt-5 border-t border-white/10 pt-4">
        <Label light>{label}</Label>
        <Text
          className={`mt-2 text-base leading-6 ${emphasis ? 'font-display text-lg text-sun' : 'font-body text-white/90'}`}
          style={italic ? { fontStyle: 'italic' } : undefined}
        >
          {body}
        </Text>
      </View>
    </Appear>
  );
}

function Searching() {
  const reduce = useReducedMotion();
  const pulse = useSharedValue(0.5);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!reduce) pulse.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.5, { duration: 900 })), -1);
    const t = setInterval(() => setI((x) => (x + 1) % copy.guide.searching.length), 2200);
    return () => clearInterval(t);
  }, [pulse, reduce]);
  const glow = useAnimatedStyle(() => ({ opacity: pulse.value, transform: [{ scale: 0.8 + pulse.value * 0.3 }] }));

  return (
    <View className="mb-4 items-center rounded-[28px] bg-night/45 px-5 py-8" accessibilityLiveRegion="polite">
      <Animated.View style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFD166' }, glow]} />
      <Text className="mt-4 font-display text-lg text-white">{copy.guide.searching[i]}</Text>
    </View>
  );
}
