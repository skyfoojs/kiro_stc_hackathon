import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { IncidentIcon } from '@/components/IncidentIcon';
import { colors } from '@/constants/theme';

const SIZE = 132;

function Ring({ delay }: { delay: number }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(reduce ? 0.6 : 0);
  useEffect(() => {
    if (reduce) return;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false));
  }, [delay, reduce, t]);
  const style = useAnimatedStyle(() => ({
    opacity: reduce ? 0.5 : 0.9 * (1 - t.value),
    transform: [{ scale: 0.7 + t.value * 0.8 }],
  }));
  return <Animated.View style={[styles.ring, style]} />;
}

// White disc with the incident icon and two expanding rings (prototype "siren").
export function SirenRings({ kind, color = colors.alert }: { kind: string | null; color?: string }) {
  return (
    <View style={styles.wrap} importantForAccessibility="no-hide-descendants">
      <Ring delay={0} />
      <Ring delay={700} />
      <View style={styles.disc}>
        <IncidentIcon kind={kind} color={color} size={64} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 4, borderColor: colors.onAlert },
  disc: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.onAlert, alignItems: 'center', justifyContent: 'center' },
});
