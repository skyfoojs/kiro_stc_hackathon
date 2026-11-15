import { Image } from 'expo-image';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

import frame0 from '@/assets/images/level22/frame-0.webp';
import frame1 from '@/assets/images/level22/frame-1.webp';
import frame2 from '@/assets/images/level22/frame-2.webp';
import frame3 from '@/assets/images/level22/frame-3.webp';
import frame4 from '@/assets/images/level22/frame-4.webp';
import frame5 from '@/assets/images/level22/frame-5.webp';
import frame6 from '@/assets/images/level22/frame-6.webp';
import { colors, radius, space, type } from '@/constants/theme';

// Level 22 rendered in Blender (Relay/blender/level22_flyin.py): the camera flies
// in from the tower stack to your floor, then the route is shown on top.
// The route, arrows and labels are drawn as plain (non-animated) layers so they
// always render; only the walker, the "you" pulse and the goal arrow move.
const FRAMES = [frame0, frame1, frame2, frame3, frame4, frame5, frame6];
const W = 940;
const H = 548;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Pt = [number, number];
type Mode = 'evacuate' | 'wait';

// Positions in the 940 x 548 render (from the prototype).
const YOU: Pt = [415.4, 187.6]; // base of the orange pin
const PLACES = {
  stairA: [162, 252] as Pt,
  stairB: [777, 178] as Pt,
  lift: [484, 244] as Pt,
  waiting: [773, 280] as Pt,
};

// Goal labels sit just below the goal, with an arrow pointing up at it, clear of the other labels.
const GOAL_LABEL: Record<Mode, { at: Pt; below: boolean }> = {
  evacuate: { at: [185, 300], below: true },
  wait: { at: [770, 296], below: true },
};

const ROUTES: Record<Mode, Pt[]> = {
  // From your desk, down to the corridor, then left into Stairwell A.
  evacuate: [YOU, [431.5, 211.4], [276.9, 251.0], [228, 262]],
  // From your desk to the waiting point beside Stairwell B.
  wait: [YOU, [431.5, 211.4], [640, 158], [690, 238], [752, 276]],
};

function measure(points: Pt[]) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  const total = cum[cum.length - 1];
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const at = (s: number) => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1]);
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, deg: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI };
  };
  const chevrons = [];
  for (let s = 60; s < total - 50; s += 60) chevrons.push(at(s));
  return { xs: points.map((p) => p[0]), ys: points.map((p) => p[1]), cum, total, d, chevrons, head: at(total) };
}

const pct = ([x, y]: Pt) => ({ left: `${(x / W) * 100}%` as const, top: `${(y / H) * 100}%` as const });

// A label pinned by its bottom centre (or top centre with `below`) to a point on the render.
function Label({ at, text, tone, below }: { at: Pt; text: string; tone: 'you' | 'navy' | 'no'; below?: boolean }) {
  return (
    <View style={[styles.anchor, pct(at), below ? styles.anchorBelow : styles.anchorAbove]} pointerEvents="none">
      <View style={[styles.pill, styles[tone]]}>
        <Text style={[styles.pillText, tone === 'you' && styles.pillTextYou]} numberOfLines={1}>
          {text}
        </Text>
      </View>
    </View>
  );
}

export function Level22Map({ mode = 'evacuate', floorLabel = 'Level 22' }: { mode?: Mode; floorLabel?: string }) {
  const reduce = useReducedMotion();
  const [frame, setFrame] = useState(reduce ? FRAMES.length - 1 : 0);
  const ready = frame === FRAMES.length - 1;
  const route = useMemo(() => measure(ROUTES[mode]), [mode]);

  const travel = useSharedValue(0);
  const pulse = useSharedValue(0);
  const bounce = useSharedValue(0);

  // Fly-in: swap the rendered frames, a little faster as it settles.
  useEffect(() => {
    if (reduce) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let i = 0;
    const step = () => {
      i++;
      setFrame(i);
      if (i < FRAMES.length - 1) timers.push(setTimeout(step, i < 3 ? 160 : 120));
    };
    timers.push(setTimeout(step, 260));
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  // Then keep it moving: someone walks the route, your spot pulses, the goal arrow bounces.
  useEffect(() => {
    if (!ready || reduce) return;
    travel.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false);
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 450, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 450, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [ready, reduce, travel, pulse, bounce]);

  const walker = useAnimatedProps(() => {
    const dist = travel.value * route.total;
    let i = 1;
    while (i < route.cum.length - 1 && route.cum[i] < dist) i++;
    const seg = route.cum[i] - route.cum[i - 1] || 1;
    const t = Math.min(1, Math.max(0, (dist - route.cum[i - 1]) / seg));
    return { cx: route.xs[i - 1] + (route.xs[i] - route.xs[i - 1]) * t, cy: route.ys[i - 1] + (route.ys[i] - route.ys[i - 1]) * t };
  });
  const ring = useAnimatedStyle(() => ({ opacity: 0.8 * (1 - pulse.value), transform: [{ scale: 0.6 + pulse.value * 1.4 }] }));
  const hop = useAnimatedStyle(() => ({ transform: [{ translateY: -bounce.value * 7 }] }));

  const goal = GOAL_LABEL[mode];
  const goalText = mode === 'evacuate' ? 'Exit: Stairwell A' : 'Wait here';
  const other = mode === 'evacuate' ? PLACES.stairB : PLACES.stairA;
  const otherText = mode === 'evacuate' ? 'Stairwell B' : 'Stairwell A';
  const head = route.head;

  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.headFloor}>{floorLabel}</Text>
        <Text style={styles.headHint}>{mode === 'evacuate' ? 'Nearest exit: Stairwell A' : 'Wait at Stairwell B'}</Text>
      </View>
      <View
        style={styles.card}
        accessible
        accessibilityRole="image"
        accessibilityLabel={
          mode === 'evacuate'
            ? '3D plan of Level 22. You are in the north wing, marked You are here. The orange route with arrows leads left to Stairwell A, your exit. Do not use the lift in the middle.'
            : '3D plan of Level 22. You are in the north wing, marked You are here. The orange route with arrows leads right to the waiting point beside Stairwell B. Stay there; rescuers will come to you. Do not use the lift in the middle.'
        }
      >
        <View style={styles.imageWrap}>
          <Image source={FRAMES[frame]} style={StyleSheet.absoluteFill} contentFit="contain" transition={0} cachePolicy="memory" />

          {ready ? (
            <>
              {/* Route, direction chevrons and a big arrowhead at the stairs */}
              <Svg viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
                <Path d={route.d} fill="none" stroke="#fff" strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
                <Path d={route.d} fill="none" stroke={colors.alert} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
                {route.chevrons.map((c) => (
                  <Polygon key={`${c.x}-${c.y}`} points="-8,-8 6,0 -8,8" fill="#fff" transform={`translate(${c.x} ${c.y}) rotate(${c.deg})`} />
                ))}
                <Polygon
                  points="-6,-20 26,0 -6,20"
                  fill={colors.alert}
                  stroke="#fff"
                  strokeWidth={4}
                  strokeLinejoin="round"
                  transform={`translate(${head.x} ${head.y}) rotate(${head.deg})`}
                />
                <AnimatedCircle r={11} fill={colors.alert} stroke="#fff" strokeWidth={5} animatedProps={walker} />
              </Svg>

              {/* You are here: pulsing ring at your spot */}
              <View style={[styles.ringAnchor, pct(YOU)]} pointerEvents="none">
                <Animated.View style={[styles.ring, ring]} />
                <View style={styles.youDot} />
              </View>

              <Label at={[YOU[0], YOU[1] - 62]} text="You are here" tone="you" />
              <Label at={other} text={otherText} tone="navy" />
              <Label at={PLACES.lift} text="No lifts" tone="no" below />

              {/* Where to go: bouncing arrow over the goal */}
              <View style={[styles.goalAnchor, pct(goal.at), goal.below ? styles.goalBelow : styles.goalAbove]} pointerEvents="none">
                {goal.below ? (
                  <Animated.View style={[styles.goalArrow, hop]}>
                    <ArrowUp color={colors.onAlert} size={18} strokeWidth={3} />
                  </Animated.View>
                ) : null}
                <View style={[styles.pill, styles.goal]}>
                  <Text style={styles.pillText} numberOfLines={1}>
                    {goalText}
                  </Text>
                </View>
                {!goal.below ? (
                  <Animated.View style={[styles.goalArrow, hop]}>
                    <ArrowDown color={colors.onAlert} size={18} strokeWidth={3} />
                  </Animated.View>
                ) : null}
              </View>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const LABEL_W = 132;
const PILL_H = 24;

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xs, paddingBottom: space.sm },
  headFloor: { ...type.bodyStrong, color: colors.ink },
  headHint: { ...type.small, color: colors.inkMuted },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', paddingTop: space.lg, paddingHorizontal: 4, paddingBottom: 2 },
  imageWrap: { width: '100%', aspectRatio: W / H },
  anchor: { position: 'absolute', width: LABEL_W, marginLeft: -LABEL_W / 2, alignItems: 'center' },
  anchorAbove: { marginTop: -PILL_H },
  anchorBelow: { marginTop: 4 },
  pill: { height: PILL_H, paddingHorizontal: 10, borderRadius: PILL_H / 2, justifyContent: 'center' },
  pillText: { fontSize: 12, fontWeight: '800', color: colors.onPrimary },
  pillTextYou: { color: colors.ink },
  you: { backgroundColor: colors.alert, borderWidth: 2, borderColor: colors.onPrimary },
  navy: { backgroundColor: colors.ink },
  no: { backgroundColor: colors.danger },
  goal: { backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.alert },
  ringAnchor: { position: 'absolute', width: 36, height: 36, marginLeft: -18, marginTop: -18, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: colors.alert },
  youDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.ink, borderWidth: 2.5, borderColor: colors.onPrimary },
  goalAnchor: { position: 'absolute', width: LABEL_W, marginLeft: -LABEL_W / 2, alignItems: 'center', gap: 4 },
  goalAbove: { marginTop: -(PILL_H + 34) },
  goalBelow: { marginTop: 2 },
  goalArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.alert,
    borderWidth: 2,
    borderColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
