import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, ICON_STROKE, radius, space, type } from '@/constants/theme';

type Variant = 'primary' | 'alert' | 'light' | 'outline' | 'outlineLight' | 'safe';
type Size = 'md' | 'lg' | 'xl';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  subtitle?: string;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
};

const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
  alert: { bg: colors.alert, fg: colors.onAlert, border: colors.alert },
  light: { bg: colors.surface, fg: colors.ink, border: colors.surface },
  outline: { bg: 'transparent', fg: colors.ink, border: colors.ink },
  outlineLight: { bg: 'transparent', fg: colors.onAlert, border: 'rgba(255,255,255,0.85)' },
  safe: { bg: colors.success, fg: colors.onPrimary, border: colors.success },
};

const heights: Record<Size, number> = { md: 56, lg: 66, xl: 84 };

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  subtitle,
  loading,
  disabled,
  accessibilityHint,
}: Props) {
  const p = palette[variant];
  const inactive = disabled || loading;
  const big = size === 'xl';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${label}. ${subtitle}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { minHeight: heights[size], backgroundColor: p.bg, borderColor: p.border },
        big && styles.big,
        pressed && styles.pressed,
        inactive && styles.inactive,
      ]}
    >
      <View style={[styles.row, big && styles.column]}>
        {loading ? (
          <ActivityIndicator color={p.fg} />
        ) : (
          Icon && <Icon color={p.fg} size={big ? 28 : 20} strokeWidth={ICON_STROKE} />
        )}
        <Text style={[styles.label, { color: p.fg }, size !== 'md' && styles.labelLg, big && styles.labelXl]}>{label}</Text>
      </View>
      {subtitle ? <Text style={[styles.subtitle, { color: p.fg }]}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    justifyContent: 'center',
  },
  big: { borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  column: { gap: space.sm },
  label: { ...type.bodyStrong, fontSize: 17 },
  labelLg: { fontSize: 19 },
  labelXl: { fontSize: 24, letterSpacing: -0.2 },
  subtitle: { ...type.small, fontWeight: '500', textAlign: 'center', opacity: 0.95, marginTop: 2 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  inactive: { opacity: 0.45 },
});
