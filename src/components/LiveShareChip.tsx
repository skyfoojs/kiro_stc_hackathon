import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors, radius, space, type } from '@/constants/theme';

// DEMO VISUAL ONLY. Nothing is uploaded yet; once `ready`, this simulates a
// location ping every few seconds. Wire it to report_location() later.
const PING_EVERY_S = 3;

export function LiveShareChip({ ready }: { ready: boolean }) {
  const [ago, setAgo] = useState(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
    const id = setInterval(() => setAgo((a) => (a + 1) % PING_EVERY_S), 1000);
    return () => clearInterval(id);
  }, [pulse]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.6 }],
  }));

  const tint = ready ? colors.success : colors.alert;

  return (
    <View
      style={[styles.chip, { backgroundColor: ready ? colors.successSoft : colors.alertSoft }]}
      accessibilityLabel={ready ? 'Sharing your live location with rescue teams' : 'Finding your location'}
    >
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.ring, { backgroundColor: tint }, ring]} />
        <View style={[styles.dot, { backgroundColor: tint }]} />
      </View>
      <Text style={[styles.text, { color: tint }]}>
        {ready ? `Live location shared · ${ago === 0 ? 'just now' : `${ago}s ago`}` : 'Finding your location…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.sm,
    paddingVertical: space.xs + 2,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
  dotWrap: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { ...type.caption, fontVariant: ['tabular-nums'] },
});
