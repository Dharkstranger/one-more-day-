import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import type { Weather } from '../services/sunshine/engine';

interface Props {
  /** 0..6 level index plus fraction toward the next level. */
  height: number;
  weather: Weather;
}

const W = 360;
const H = 220;
const HORIZON = 190;

/**
 * The sun climbs as lifetime rays grow (it never sinks). Today's weather
 * adds clouds or rain on top. Stars show while the sun is still low.
 */
export function SkyHero({ height, weather }: Props) {
  const t = Math.max(0, Math.min(1, height / 6));
  const sunY = HORIZON + 30 - t * 170; // starts just below the horizon
  const sunR = 30 + t * 8;
  const glow = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.85, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const stars = t < 0.45;
  const rays = t >= 0.4;
  const clouds = weather === 'cloudy' || weather === 'rain' || weather === 'storm' || weather === 'clearing';
  const dark = weather === 'storm' || weather === 'rain';

  return (
    <View accessibilityRole="image" accessibilityLabel={`Sky: ${weather}`} className="items-center">
      <Animated.View style={{ transform: [{ scale: glow }], opacity: glow }} pointerEvents="none">
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 300 }}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFE08A" stopOpacity="0.9" />
              <Stop offset="60%" stopColor="#FFB547" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#FFB547" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={W / 2} cy={sunY} r={sunR * 2.6} fill="url(#glow)" />
        </Svg>
      </Animated.View>

      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', minWidth: 300 }}>
        {stars ? (
          <G opacity={1 - t * 2}>
            {STAR_POINTS.map(([x, y, r], i) => (
              <Circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.8} />
            ))}
          </G>
        ) : null}

        {rays ? (
          <G opacity={Math.min(1, (t - 0.4) * 2.5)}>
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <Line
                  key={i}
                  x1={W / 2 + Math.cos(a) * (sunR + 10)}
                  y1={sunY + Math.sin(a) * (sunR + 10)}
                  x2={W / 2 + Math.cos(a) * (sunR + 24)}
                  y2={sunY + Math.sin(a) * (sunR + 24)}
                  stroke="#FFE08A"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        ) : null}

        <Circle cx={W / 2} cy={sunY} r={sunR} fill="#FFD166" />
        <Circle cx={W / 2 - sunR * 0.3} cy={sunY - sunR * 0.3} r={sunR * 0.35} fill="#FFE9A8" opacity={0.7} />

        <Defs>
          <LinearGradient id="hill" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#000" stopOpacity="0" />
            <Stop offset="0.2" stopColor="#000" stopOpacity="0.22" />
            <Stop offset="0.8" stopColor="#000" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#000" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* Soft hills on the horizon, fading out at the edges so there's no hard box */}
        <Path d={`M0 ${HORIZON} Q 90 ${HORIZON - 26} 180 ${HORIZON - 6} T ${W} ${HORIZON - 14} V ${H} H 0 Z`} fill="url(#hill)" />
        <Path d={`M0 ${HORIZON + 12} Q 120 ${HORIZON - 4} 240 ${HORIZON + 8} T ${W} ${HORIZON + 4} V ${H} H 0 Z`} fill="url(#hill)" />

        {clouds ? (
          <G opacity={dark ? 0.95 : 0.85}>
            <Cloud x={W / 2 - 90} y={Math.min(sunY - 12, 120)} s={1.1} dark={dark} />
            <Cloud x={W / 2 + 50} y={Math.min(sunY - 44, 90)} s={0.8} dark={dark} />
            {weather !== 'clearing' ? <Cloud x={30} y={50} s={0.7} dark={dark} /> : null}
          </G>
        ) : null}

        {dark ? (
          <G stroke="#B9C6FF" strokeWidth={2} strokeLinecap="round" opacity={0.7}>
            {RAIN.map(([x, y], i) => (
              <Line key={i} x1={x} y1={y} x2={x - 4} y2={y + 12} />
            ))}
          </G>
        ) : null}
      </Svg>
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
  [110, 120], [130, 140], [150, 118], [170, 138], [190, 122], [210, 144], [230, 126], [250, 140], [140, 160], [200, 164],
];
