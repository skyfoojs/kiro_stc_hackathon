import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, ICON_STROKE, radius, space, type } from '@/constants/theme';

type Tone = 'muted' | 'navy' | 'alert';

type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  initials?: string;
  tone?: Tone;
  right?: ReactNode;
  onPress?: () => void;
  first?: boolean;
};

const toneBg: Record<Tone, string> = { muted: colors.background, navy: colors.primary, alert: colors.alert };

// One row of a white list card: avatar or icon, title, optional subtitle and trailing element.
export function ListRow({ title, subtitle, icon: Icon, initials, tone = 'muted', right, onPress, first }: Props) {
  const fg = tone === 'muted' ? colors.ink : colors.onPrimary;
  const body = (
    <>
      {Icon || initials ? (
        <View style={[styles.avatar, { backgroundColor: toneBg[tone] }]}>
          {Icon ? <Icon color={fg} size={20} strokeWidth={ICON_STROKE} /> : <Text style={[styles.initials, { color: fg }]}>{initials}</Text>}
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.row, !first && styles.divider, pressed && styles.pressed]}
      >
        {body}
      </Pressable>
    );
  }
  return <View style={[styles.row, !first && styles.divider]}>{body}</View>;
}

export function ListCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md + 2, paddingHorizontal: space.lg, minHeight: 64 },
  divider: { borderTopWidth: 1, borderTopColor: colors.background },
  pressed: { backgroundColor: colors.surfaceMuted },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 15, fontWeight: '800' },
  text: { flex: 1, minWidth: 0 },
  title: { ...type.bodyStrong, color: colors.ink },
  subtitle: { ...type.small, color: colors.inkMuted },
});
