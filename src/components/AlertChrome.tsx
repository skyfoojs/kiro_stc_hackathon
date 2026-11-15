import { Volume2, VolumeX } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@/constants/theme';

// White inset glow that flashes four times when the alert opens: a visual
// alarm for people who can't hear the siren.
export function AlertPulse() {
  const reduce = useReducedMotion();
  const o = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    o.value = withRepeat(withSequence(withTiming(1, { duration: 550 }), withTiming(0, { duration: 550 })), 4, false);
  }, [o, reduce]);

  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View pointerEvents="none" style={[styles.pulse, style]} />;
}

// Mute / unmute the siren. Sits below the status bar so iOS doesn't cover it.
export function SoundToggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? 'Turn alarm sound off' : 'Turn alarm sound on'}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.sound, { top: insets.top + space.xxl }, pressed && styles.pressed]}
    >
      {on ? <Volume2 color={colors.onAlert} size={22} strokeWidth={2.2} /> : <VolumeX color={colors.onAlert} size={22} strokeWidth={2.2} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pulse: { ...StyleSheet.absoluteFill, borderWidth: 14, borderColor: 'rgba(255,255,255,0.75)' },
  sound: {
    position: 'absolute',
    right: space.lg + 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pressed: { backgroundColor: 'rgba(255,255,255,0.15)' },
});
