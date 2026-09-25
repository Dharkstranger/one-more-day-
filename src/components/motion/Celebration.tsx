// Moments of joy: a "+N rays" burst when light is earned, and a full-screen
// sunrise when a new level is reached. Screens call `useCelebrate()(rays)`.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSQLiteContext } from 'expo-sqlite';
import { totalRays } from '../../db/repo/rays';
import { levelFor } from '../../services/sunshine/engine';
import type { Level } from '../../services/sunshine/rules';
import { SKY_GRADIENTS } from '../../theme/sky';
import { success } from '../../services/haptics';
import { copy } from '../../copy/en';

type Celebrate = (rays: number) => void;
const Ctx = createContext<Celebrate>(() => {});
export const useCelebrate = () => useContext(Ctx);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [bursts, setBursts] = useState<{ id: number; rays: number }[]>([]);
  const [levelUp, setLevelUp] = useState<Level | null>(null);
  const lastLevel = useRef<number | null>(null);

  useEffect(() => {
    void totalRays(db).then((t) => (lastLevel.current = levelFor(t).level.index));
  }, [db]);

  const celebrate = useCallback<Celebrate>(
    (rays) => {
      if (rays > 0) {
        success();
        const id = Date.now() + Math.random();
        setBursts((b) => [...b, { id, rays }]);
        setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1800);
      }
      void totalRays(db).then((t) => {
        const level = levelFor(t).level;
        if (lastLevel.current !== null && level.index > lastLevel.current) setTimeout(() => setLevelUp(level), 900);
        lastLevel.current = level.index;
      });
    },
    [db],
  );

  return (
    <Ctx.Provider value={celebrate}>
      {children}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' }}>
        {bursts.map((b) => (
          <RayBurst key={b.id} rays={b.rays} />
        ))}
      </View>
      {levelUp ? <LevelUp level={levelUp} onDone={() => setLevelUp(null)} /> : null}
    </Ctx.Provider>
  );
}

const SPARKS = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2);

function RayBurst({ rays }: { rays: number }) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  const o = useSharedValue(0);
  const s = useSharedValue(0.6);

  useEffect(() => {
    o.value = withSequence(withTiming(1, { duration: 180 }), withDelay(900, withTiming(0, { duration: 600 })));
    s.value = withSpring(1, { damping: 9, stiffness: 180 });
    if (!reduce) y.value = withTiming(-120, { duration: 1600, easing: Easing.out(Easing.cubic) });
  }, [o, s, y, reduce]);

  const label = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { scale: s.value }] }));

  return (
    <View style={{ position: 'absolute', top: '42%', alignItems: 'center' }}>
      {!reduce ? SPARKS.map((a, i) => <Spark key={i} angle={a} />) : null}
      <Animated.View style={[{ backgroundColor: '#FFD166', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 }, label]}>
        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: '#1C1B2E' }}>+{rays} ✨</Text>
      </Animated.View>
    </View>
  );
}

function Spark({ angle }: { angle: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateX: Math.cos(angle) * 90 * t.value }, { translateY: Math.sin(angle) * 90 * t.value }, { scale: 1 - t.value * 0.5 }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', top: 18, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFE08A' }, style]} />
  );
}

function LevelUp({ level, onDone }: { level: Level; onDone: () => void }) {
  const reduce = useReducedMotion();
  // Ends 30px above the bottom of its window so the whole sun and its glow show.
  const sun = useSharedValue(reduce ? -30 : 220);
  const glow = useSharedValue(0.6);
  useEffect(() => {
    sun.value = withTiming(-30, { duration: 1800, easing: Easing.out(Easing.cubic) });
    glow.value = withDelay(1200, withTiming(1, { duration: 800 }));
  }, [sun, glow]);
  const sunStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sun.value }, { scale: glow.value * 0.3 + 0.8 }] }));
  const colors = SKY_GRADIENTS[level.index];

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(400)}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <Pressable accessibilityRole="button" accessibilityLabel={copy.levelUp.tap} onPress={onDone} style={{ flex: 1 }}>
        <LinearGradient colors={colors} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ height: 240, justifyContent: 'flex-end', overflow: 'hidden', width: '100%', alignItems: 'center' }}>
            <Animated.View style={[{ width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFD166', shadowColor: '#FFB547', shadowOpacity: 0.9, shadowRadius: 50 }, sunStyle]} />
          </View>
          <Animated.Text
            entering={reduce ? undefined : FadeIn.delay(1300).duration(600)}
            style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 13, letterSpacing: 3, color: '#FFFFFFCC', marginTop: 32, textTransform: 'uppercase' }}
          >
            {copy.levelUp.kicker}
          </Animated.Text>
          <Animated.Text
            entering={reduce ? undefined : FadeIn.delay(1500).duration(600)}
            style={{ fontFamily: 'Fraunces_700Bold', fontSize: 44, color: level.index >= 4 ? '#1C1B2E' : '#FFFFFF', marginTop: 8 }}
          >
            {level.name}
          </Animated.Text>
          <Animated.Text
            entering={reduce ? undefined : FadeIn.delay(1800).duration(600)}
            style={{ fontFamily: 'Nunito_400Regular', fontSize: 18, lineHeight: 26, textAlign: 'center', color: level.index >= 4 ? '#1C1B2ECC' : '#FFFFFFD9', marginTop: 12, maxWidth: 340 }}
          >
            {level.line}
          </Animated.Text>
          <Animated.Text
            entering={reduce ? undefined : FadeIn.delay(2600).duration(600)}
            style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: level.index >= 4 ? '#1C1B2E99' : '#FFFFFF99', marginTop: 40 }}
          >
            {copy.levelUp.tap}
          </Animated.Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
