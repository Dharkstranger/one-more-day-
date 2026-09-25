import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { Weather } from '../services/sunshine/engine';

interface Props {
  /** 0..6: level index plus fraction toward the next level. */
  height: number;
  weather: Weather;
}

const W = 360;
const H = 220;
const HORIZON = 190;
const CX = W / 2;
const SUN_R = 34;

/** Where the sun sits for a given progress (0 = just below the horizon). */
const sunYFor = (height: number) => HORIZON + 30 - Math.max(0, Math.min(1, height / 6)) * 170;

/**
 * The sun climbs as lifetime rays grow and never sinks. Today's weather adds
 * clouds or rain on top. Layers animate independently: the sun glides to its
 * new height, stars twinkle, clouds drift, rain falls. All motion stops when the
 * device asks for reduced motion.
 */
export function SkyHero({ height, weather }: Props) {
  const reduce = useReducedMotion();
  const t = Math.max(0, Math.min(1, height / 6));

  // Sun: glides from its last position (or from below the horizon on first show).
  const sunY = useSharedValue(reduce ? sunYFor(height) : HORIZON + 40);
  const breathe = useSharedValue(1);
  const twinkle = useSharedValue(0.7);
  const drift = useSharedValue(0);
  const rain = useSharedValue(0);

  useEffect(() => {
    sunY.value = withTiming(sunYFor(height), { duration: reduce ? 0 : 1600, easing: Easing.out(Easing.cubic) });
  }, [height, reduce, sunY]);

  useEffect(() => {
    if (reduce) return;
    breathe.value = withRepeat(withSequence(withTiming(1.08, { duration: 2600 }), withTiming(1, { duration: 2600 })), -1);
    twinkle.value = withRepeat(withSequence(withTiming(1, { duration: 1400 }), withTiming(0.45, { duration: 1400 })), -1);
    drift.value = withRepeat(withSequence(withTiming(14, { duration: 6000 }), withTiming(-14, { duration: 6000 })), -1, true);
    rain.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.linear }), -1);
  }, [reduce, breathe, twinkle, drift, rain]);

  const sunLayer = useAnimatedStyle(() => ({ transform: [{ translateY: sunY.value - HORIZON }] }));
  const glowLayer = useAnimatedStyle(() => ({ transform: [{ translateY: sunY.value - HORIZON }, { scale: breathe.value }] }));
  const starLayer = useAnimatedStyle(() => ({ opacity: twinkle.value * (1 - t * 2) }));
  const cloudLayer = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value }] }));
  const rainLayer = useAnimatedStyle(() => ({ transform: [{ translateY: rain.value * 16 }], opacity: 1 - rain.value * 0.4 }));

  const stars = t < 0.45;
  const rays = t >= 0.4;
  const clouds = weather !== 'clear';
  const dark = weather === 'storm' || weather === 'rain';
  const cloudTop = Math.min(sunYFor(height) - 12, 120);

  const layer = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: H };
  const svg = (children: React.ReactNode) => (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 300 }}>
      {children}
    </Svg>
  );

  return (
    <View accessibilityRole="image" accessibilityLabel={`Sky: ${weather}`} style={{ height: H, width: '100%', overflow: 'hidden' }}>
      {stars ? (
        <Animated.View style={[layer, starLayer]} pointerEvents="none">
          {svg(STAR_POINTS.map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" />))}
        </Animated.View>
      ) : null}

      {/* Sun glow and sun are drawn around the horizon line, then moved up/down as a layer. */}
      <Animated.View style={[layer, glowLayer]} pointerEvents="none">
        {svg(
          <>
            <Defs>
              <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFE08A" stopOpacity="0.85" />
                <Stop offset="60%" stopColor="#FFB547" stopOpacity="0.22" />
                <Stop offset="100%" stopColor="#FFB547" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={CX} cy={HORIZON} r={SUN_R * 2.7} fill="url(#glow)" />
          </>,
        )}
      </Animated.View>
      <Animated.View style={[layer, sunLayer]} pointerEvents="none">
        {svg(
          <>
            {rays ? (
              <G opacity={Math.min(1, (t - 0.4) * 2.5)}>
                {Array.from({ length: 12 }).map((_, i) => {
                  const a = (i / 12) * Math.PI * 2;
                  return (
                    <Line
                      key={i}
                      x1={CX + Math.cos(a) * (SUN_R + 10)}
                      y1={HORIZON + Math.sin(a) * (SUN_R + 10)}
                      x2={CX + Math.cos(a) * (SUN_R + 24)}
                      y2={HORIZON + Math.sin(a) * (SUN_R + 24)}
                      stroke="#FFE08A"
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                  );
                })}
              </G>
            ) : null}
            <Circle cx={CX} cy={HORIZON} r={SUN_R} fill="#FFD166" />
            <Circle cx={CX - SUN_R * 0.3} cy={HORIZON - SUN_R * 0.3} r={SUN_R * 0.35} fill="#FFE9A8" opacity={0.7} />
          </>,
        )}
      </Animated.View>

      {/* Hills cover the sun when it's below the horizon. */}
      <View style={layer} pointerEvents="none">
        {svg(
          <>
            <Defs>
              <LinearGradient id="hill" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#0B1026" stopOpacity="0" />
                <Stop offset="0.2" stopColor="#0B1026" stopOpacity="0.55" />
                <Stop offset="0.8" stopColor="#0B1026" stopOpacity="0.55" />
                <Stop offset="1" stopColor="#0B1026" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Path d={`M0 ${HORIZON} Q 90 ${HORIZON - 26} 180 ${HORIZON - 6} T ${W} ${HORIZON - 14} V ${H} H 0 Z`} fill="url(#hill)" />
            <Path d={`M0 ${HORIZON + 12} Q 120 ${HORIZON - 4} 240 ${HORIZON + 8} T ${W} ${HORIZON + 4} V ${H} H 0 Z`} fill="url(#hill)" />
          </>,
        )}
      </View>

      {clouds ? (
        <Animated.View style={[layer, cloudLayer]} pointerEvents="none">
          {svg(
            <G opacity={dark ? 0.95 : 0.85}>
              <Cloud x={CX - 90} y={cloudTop} s={1.1} dark={dark} />
              <Cloud x={CX + 50} y={cloudTop - 32} s={0.8} dark={dark} />
              {weather !== 'clearing' ? <Cloud x={30} y={50} s={0.7} dark={dark} /> : null}
            </G>,
          )}
        </Animated.View>
      ) : null}

      {dark ? (
        <Animated.View style={[layer, rainLayer]} pointerEvents="none">
          {svg(
            <G stroke="#B9C6FF" strokeWidth={2} strokeLinecap="round" opacity={0.7}>
              {RAIN.map(([x, y], i) => (
                <Line key={i} x1={x} y1={y} x2={x - 4} y2={y + 12} />
              ))}
            </G>,
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}

function Cloud({ x, y, s, dark }: { x: number; y: number; s: number; dark: boolean }) {
  const fill = dark ? '#8F95B8' : '#FFFFFF';
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={30} cy={20} rx={30} ry={16} fill={fill} />
      <Ellipse cx={58} cy={14} rx={24} ry={18} fill={fill} />
      <Ellipse cx={80} cy={22} rx={22} ry={13} fill={fill} />
    </G>
  );
}

const STAR_POINTS: [number, number, number][] = [
  [30, 30, 1.5], [80, 60, 1], [120, 20, 1.8], [200, 40, 1.2], [250, 18, 1.5], [300, 50, 1], [335, 25, 1.6],
  [60, 110, 1], [160, 90, 1.2], [280, 100, 1.3], [20, 150, 1], [340, 140, 1.1],
];
const RAIN: [number, number][] = [
  [110, 110], [130, 130], [150, 108], [170, 128], [190, 112], [210, 134], [230, 116], [250, 130], [140, 150], [200, 154],
];
