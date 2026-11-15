import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '@/constants/theme';

type Tone = 'safe' | 'wait' | 'unacc' | 'neutral';

const tones: Record<Tone, { bg: string; fg: string }> = {
  safe: { bg: colors.successSoft, fg: colors.success },
  wait: { bg: colors.waitSoft, fg: colors.wait },
  unacc: { bg: colors.dangerSoft, fg: colors.danger },
  neutral: { bg: colors.background, fg: colors.inkMuted },
};

// Status pill. Each tone has its own shape too (dot, square, spinner), not only a colour.
export function Pill({ tone, label, busy }: { tone: Tone; label: string; busy?: boolean }) {
  const t = tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {busy ? (
        <ActivityIndicator size="small" color={t.fg} style={styles.spinner} />
      ) : (
        <View style={[styles.mark, { backgroundColor: t.fg }, tone === 'wait' && styles.square, tone === 'unacc' && styles.diamond]} />
      )}
      <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: space.sm + 2,
    borderRadius: radius.pill,
  },
  mark: { width: 8, height: 8, borderRadius: 4 },
  square: { borderRadius: 2 },
  diamond: { borderRadius: 0, transform: [{ rotate: '45deg' }] },
  spinner: { transform: [{ scale: 0.7 }], width: 12, height: 12 },
  label: { ...type.caption },
});
