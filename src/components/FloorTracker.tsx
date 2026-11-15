import { useEffect, useState } from 'react';
import { StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { FloorRadar } from '@/components/FloorRadar';
import { colors, radius, space, type } from '@/constants/theme';

// DEMO VISUAL ONLY. Nothing is measured yet: a radar "searches" for 2 seconds,
// then it locks onto the floor from the user's profile with a plausible pressure.
// Swap in expo-sensors Barometer readings here later (see docs/DATABASE_AND_API.md 7).

const SEA_LEVEL_HPA = 1013.25;
const HPA_PER_METRE = 0.12;
const LOCATE_MS = 2000;

const ROW_H = 4;
const ROW_GAP = 2;

type Props = {
  floor: number;
  totalFloors?: number;
  floorHeightM?: number;
  onLocated?: () => void;
};

export function FloorTracker({ floor, totalFloors = 38, floorHeightM = 4, onLocated }: Props) {
  const [located, setLocated] = useState(false);

  const altitude = floor * floorHeightM;
  const basePressure = SEA_LEVEL_HPA - altitude * HPA_PER_METRE;
  // While searching the reading wanders widely, like a sensor settling.
  const [pressure, setPressure] = useState(SEA_LEVEL_HPA);

  const levels = Array.from({ length: totalFloors + 1 }, (_, i) => totalFloors - i);
  const pulse = useSharedValue(0);

  useEffect(() => {
    const started = Date.now();
    const settle = setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / LOCATE_MS);
      const target = SEA_LEVEL_HPA + (basePressure - SEA_LEVEL_HPA) * t;
      setPressure(target + (Math.random() - 0.5) * 3 * (1 - t));
    }, 80);
    const lock = setTimeout(() => {
      clearInterval(settle);
      setPressure(basePressure);
      pulse.value = withRepeat(withTiming(1, { duration: 1600 }), -1, false);
      Vibration.vibrate(40);
      setLocated(true);
      onLocated?.();
    }, LOCATE_MS);
    return () => {
      clearInterval(settle);
      clearTimeout(lock);
    };
    // Runs once per mount; the floor doesn't change while this screen is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Small live-looking jitter once locked.
  useEffect(() => {
    if (!located) return;
    const id = setInterval(() => setPressure(basePressure + (Math.random() - 0.5) * 0.08), 1500);
    return () => clearInterval(id);
  }, [located, basePressure]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.4 }],
  }));

  if (!located) {
    return (
      <Animated.View exiting={FadeOut.duration(200)} style={[styles.card, styles.searching]} accessible accessibilityLabel="Finding your floor" accessibilityLiveRegion="polite">
        <FloorRadar />
        <View style={styles.searchText}>
          <Text style={styles.searchTitle}>Finding your floor…</Text>
          <Text style={styles.reading}>Reading air pressure · {pressure.toFixed(1)} hPa</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.card, styles.located]}
      accessible
      accessibilityLabel={`You're on floor ${floor}, estimated from air pressure.`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.building} importantForAccessibility="no-hide-descendants">
        <View style={styles.levels}>
          {levels.map((level) => (
            <View key={level} style={styles.levelRow}>
              <View style={[styles.level, level === floor && styles.levelYou]} />
              {level === floor ? (
                <View style={styles.dotWrap}>
                  <Animated.View style={[styles.dotRing, ringStyle]} />
                  <View style={styles.dot} />
                </View>
              ) : null}
            </View>
          ))}
        </View>
        <View style={styles.ground} />
      </View>

      <View style={styles.readout}>
        <Text style={styles.caption}>You’re on</Text>
        <Animated.Text entering={ZoomIn.springify().damping(14)} style={styles.floor}>
          L{floor}
        </Animated.Text>
        <Text style={styles.estimate}>Estimated from air pressure</Text>
        <View style={styles.stats}>
          <View>
            <Text style={styles.statValue}>{pressure.toFixed(1)}</Text>
            <Text style={styles.statLabel}>hPa</Text>
          </View>
          <View style={styles.statDivider} />
          <View>
            <Text style={styles.statValue}>~{altitude} m</Text>
            <Text style={styles.statLabel}>above ground</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    minHeight: 290,
  },
  searching: { alignItems: 'center', justifyContent: 'center', gap: space.lg },
  searchText: { alignItems: 'center', gap: 2 },
  searchTitle: { ...type.heading, color: colors.ink },
  reading: { ...type.small, color: colors.inkMuted, fontVariant: ['tabular-nums'] },
  located: { flexDirection: 'row', gap: space.xl },
  building: {
    width: 64,
    padding: space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  levels: { gap: ROW_GAP },
  levelRow: { justifyContent: 'center' },
  level: { height: ROW_H, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)' },
  levelYou: { height: ROW_H + 2, backgroundColor: colors.alert },
  dotWrap: { position: 'absolute', right: -22, width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  dotRing: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.alert },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.alert, borderWidth: 2, borderColor: colors.surface },
  ground: { height: 3, marginTop: space.xs, borderRadius: 2, backgroundColor: colors.onPrimary },
  readout: { flex: 1, justifyContent: 'center', gap: 2, paddingLeft: space.sm },
  caption: { ...type.caption, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  floor: { fontSize: 56, lineHeight: 62, fontWeight: '800', color: colors.ink },
  estimate: { ...type.small, color: colors.inkMuted },
  stats: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg },
  statValue: { ...type.bodyStrong, color: colors.ink, fontVariant: ['tabular-nums'] },
  statLabel: { ...type.caption, color: colors.inkSubtle, fontWeight: '500' },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
});
