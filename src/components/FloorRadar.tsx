import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors } from '@/constants/theme';

const SWEEP_MS = 1100;
const TRAIL_DEG = 70;
const TRAIL_SLICES = 7;

// Points where "readings" flash as the beam passes (angle in degrees, 0..1 radius).
const BLIPS = [
  { deg: 40, r: 0.62, delay: 120 },
  { deg: 150, r: 0.38, delay: 450 },
  { deg: 245, r: 0.78, delay: 760 },
  { deg: 310, r: 0.5, delay: 980 },
];

function polar(c: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180; // 0deg = 12 o'clock, clockwise
  return { x: c + r * Math.cos(rad), y: c + r * Math.sin(rad) };
}

function wedge(c: number, r: number, from: number, to: number): string {
  const a = polar(c, r, from);
  const b = polar(c, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${c} ${c} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

function Blip({ x, y, delay, small }: { x: number; y: number; delay: number; small?: boolean }) {
  const o = useSharedValue(0);
  useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: SWEEP_MS - 120 })), -1, false));
  }, [o, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ scale: 0.6 + o.value * 0.6 }],
  }));
  const s = small ? 5 : 8;
  return (
    <Animated.View
      style={[
        styles.blip,
        {
          left: x - s / 2,
          top: y - s / 2,
          width: s,
          height: s,
          borderRadius: s / 2,
        },
        style,
      ]}
    />
  );
}

// DEMO VISUAL ONLY: a radar sweep shown while "finding" the user's floor.
export function FloorRadar({ size = 190, tint = colors.alert }: { size?: number; tint?: string }) {
  const reduceMotion = useReducedMotion();
  const c = size / 2;
  const r = c - 2;
  const spin = useSharedValue(0);
  const ping = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    spin.value = withRepeat(withTiming(360, { duration: SWEEP_MS, easing: Easing.linear }), -1, false);
    ping.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }), -1, false);
  }, [reduceMotion, spin, ping]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));
  const pingStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - ping.value),
    transform: [{ scale: 0.2 + ping.value * 0.8 }],
  }));

  const slice = TRAIL_DEG / TRAIL_SLICES;

  return (
    <View style={{ width: size, height: size }} importantForAccessibility="no-hide-descendants">
      {/* Dish: rings and crosshair */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={r} fill={colors.primary} />
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <Circle key={k} cx={c} cy={c} r={r * k} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
        ))}
        <Line x1={c} y1={2} x2={c} y2={size - 2} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        <Line x1={2} y1={c} x2={size - 2} y2={c} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      </Svg>

      {/* Expanding ping from the centre */}
      <Animated.View style={[styles.ping, { width: size, height: size, borderRadius: c, borderColor: tint }, pingStyle]} />

      {/* Rotating beam: bright leading edge, fading trail behind it (clockwise) */}
      <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
        <Svg width={size} height={size}>
          {Array.from({ length: TRAIL_SLICES }, (_, i) => (
            <Path
              key={i}
              d={wedge(c, r, -TRAIL_DEG + i * slice, -TRAIL_DEG + (i + 1) * slice + 0.5)}
              fill={tint}
              fillOpacity={0.04 + (i / TRAIL_SLICES) * 0.38}
            />
          ))}
          <Line x1={c} y1={c} x2={c} y2={2} stroke={tint} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      </Animated.View>

      {BLIPS.map((b) => {
        const p = polar(c, r * b.r, b.deg);
        return <Blip key={b.deg} x={p.x} y={p.y} delay={b.delay} small={size < 100} />;
      })}

      {/* You */}
      <View
        style={[
          styles.centre,
          {
            left: c - (size < 100 ? 4 : 7),
            top: c - (size < 100 ? 4 : 7),
            backgroundColor: tint,
          },
          size < 100 && styles.centreSmall,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ping: { position: 'absolute', borderWidth: 2 },
  blip: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.alertSoft,
    shadowColor: colors.alert,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  centreSmall: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  centre: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.alert,
    borderWidth: 2,
    borderColor: colors.onPrimary,
  },
});
