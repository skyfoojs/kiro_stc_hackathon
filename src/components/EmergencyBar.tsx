import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space, type } from '@/constants/theme';
import { IncidentIcon } from '@/components/IncidentIcon';
import { incidentName } from '@/lib/labels';

function elapsed(since: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Where you are in the emergency, shown as a four-step strip under the banner.
export type Progress = { labels: string[]; current: number; done?: boolean };

type Props = {
  kind: string | null;
  place: string;
  tower: string;
  startedAt: string;
  progress?: Progress;
};

export const NEEDS_STEPS = ['Alert', 'Help sent', 'Help coming', 'Safe'];
export const LEAVE_STEPS = ['Alert', 'Get out', 'Check in', 'Safe'];

// Orange incident banner at the top of every emergency screen.
export function EmergencyBar({ kind, place, tower, startedAt, progress }: Props) {
  const insets = useSafeAreaInsets();
  const [clock, setClock] = useState(() => elapsed(startedAt));

  useEffect(() => {
    const id = setInterval(() => setClock(elapsed(startedAt)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <View>
      <View style={[styles.bar, { paddingTop: insets.top + space.sm }]} accessibilityRole="header">
        <View style={styles.tile}>
          <IncidentIcon kind={kind} color={colors.onAlert} size={22} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>
            {incidentName(kind)}, {place}
          </Text>
          <Text style={styles.sub}>{tower}. Evacuate.</Text>
        </View>
        <Text style={styles.clock} accessibilityLabel={`${clock} since the alert`}>
          {clock}
        </Text>
      </View>
      {progress ? (
        <View style={styles.prog} accessibilityLabel={`Your progress: ${progress.labels[Math.min(progress.current, progress.labels.length - 1)]}`}>
          {progress.labels.map((label, i) => {
            const done = progress.done || i < progress.current;
            const cur = !progress.done && i === progress.current;
            return (
              <View key={label} style={styles.progItem}>
                <View style={[styles.progBar, done && styles.progDone, cur && styles.progCur]} />
                <Text style={[styles.progLabel, (done || cur) && styles.progLabelOn]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.alert,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg + 2,
    paddingBottom: space.md,
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: radius.sm + 4,
    backgroundColor: colors.onAlertTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: {
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '800',
    color: colors.onAlert,
  },
  sub: { ...type.small, color: colors.onAlertMuted },
  prog: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.sm + 1,
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progItem: { flex: 1 },
  progBar: { height: 5, borderRadius: 3, backgroundColor: colors.border },
  progDone: { backgroundColor: colors.ink },
  progCur: { backgroundColor: colors.alert },
  progLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkMuted,
    marginTop: 4,
  },
  progLabelOn: { color: colors.ink },
  clock: {
    ...type.bodyStrong,
    fontSize: 14,
    color: colors.onAlert,
    fontVariant: ['tabular-nums'],
  },
});
