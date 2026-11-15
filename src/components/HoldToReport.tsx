import { Siren } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';

import { colors, ICON_STROKE, radius, space, type } from '@/constants/theme';

const HOLD_MS = 1200;

type Props = { onConfirm: () => void; loading?: boolean; disabled?: boolean; label?: string };

// Press and hold so a pocket tap can't evacuate a whole tower.
// Screen readers get a direct "activate" action instead of the hold.
export function HoldToReport({ onConfirm, loading, disabled, label = 'Hold to report emergency' }: Props) {
  const [progress] = useState(() => new Animated.Value(0));
  const [holding, setHolding] = useState(false);

  const start = () => {
    if (loading || disabled) return;
    setHolding(true);
    Vibration.vibrate(20);
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        Vibration.vibrate(60);
        onConfirm();
      }
      setHolding(false);
      progress.setValue(0);
    });
  };

  const cancel = () => {
    progress.stopAnimation();
  };

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Report an emergency"
      accessibilityHint="Press and hold to alert everyone in the building"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => !disabled && onConfirm()}
      onPressIn={start}
      onPressOut={cancel}
      disabled={loading || disabled}
      accessibilityState={{ disabled: !!(loading || disabled), busy: !!loading }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.fill, { width }]} />
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.onAlert} />
        ) : (
          <Siren color={colors.onAlert} size={26} strokeWidth={ICON_STROKE} />
        )}
        <Text style={styles.label}>{loading ? 'Alerting the building…' : holding ? 'Keep holding…' : label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.alert,
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: colors.alert,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  fill: { ...StyleSheet.absoluteFill, backgroundColor: colors.alertPressed },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md, paddingHorizontal: space.xl },
  label: { ...type.heading, color: colors.onAlert },
});
