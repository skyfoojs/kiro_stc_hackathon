import { CircleCheck, Info, TriangleExclamationPoint } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, ICON_STROKE, radius, space, type } from '@/constants/theme';

type Tone = 'info' | 'warn' | 'ok';

const tones = {
  info: { bg: colors.surfaceMuted, edge: colors.ink, icon: Info, fg: colors.ink },
  warn: { bg: colors.alertSoft, edge: colors.alert, icon: TriangleExclamationPoint, fg: colors.ink },
  ok: { bg: colors.successSoft, edge: colors.success, icon: CircleCheck, fg: colors.success },
} as const;

export function Note({ tone = 'info', children }: { tone?: Tone; children: ReactNode }) {
  const t = tones[tone];
  const Icon = t.icon;
  return (
    <View style={[styles.note, { backgroundColor: t.bg, borderLeftColor: t.edge }]}>
      <Icon color={t.fg} size={20} strokeWidth={ICON_STROKE} />
      <Text style={[styles.text, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', gap: space.sm + 2, padding: space.md + 2, borderRadius: radius.sm, borderLeftWidth: 4 },
  text: { ...type.small, fontSize: 15, flex: 1 },
});
