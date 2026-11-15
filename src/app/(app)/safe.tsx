import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { EmergencyBar, LEAVE_STEPS, NEEDS_STEPS } from '@/components/EmergencyBar';
import { ListCard, ListRow } from '@/components/ListRow';
import { Ping } from '@/components/Ping';
import { Pill } from '@/components/Pill';
import { colors, radius, space, type } from '@/constants/theme';
import { useIncident } from '@/lib/incident-context';
import { fetchOfficeStatus, floorName } from '@/lib/incidents';
import { clockTime } from '@/lib/labels';
import type { OfficeStatus } from '@/types/incident';

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

// "You're safe!" plus who from your own office has checked in (names only).
export default function SafeScreen() {
  const router = useRouter();
  const { active } = useIncident();
  const [office, setOffice] = useState<OfficeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const incidentId = active?.incident.id;

  const load = useCallback(() => {
    if (!incidentId) return;
    fetchOfficeStatus(incidentId)
      .then((o) => {
        setOffice(o);
        setError(null);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load your office.'));
  }, [incidentId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  if (!active) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.ink} size="large" />
      </View>
    );
  }

  const { incident, me, help_request: help } = active;
  const people = office?.people ?? [];
  const here = people.filter((p) => p.safe).length;

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <EmergencyBar
        kind={incident.type}
        place={floorName(incident.floor_level, incident.floor_label)}
        tower={incident.tower_name}
        startedAt={incident.started_at}
        progress={{
          labels: help ? NEEDS_STEPS : LEAVE_STEPS,
          current: 3,
          done: true,
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.mascot}>
          <Ping pose="jump" state="safe" size={108} />
        </View>

        <Animated.View entering={FadeInDown.duration(350)} style={styles.status}>
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.ring}>
            <Check color={colors.onPrimary} size={34} strokeWidth={3} />
          </Animated.View>
          <Text style={styles.statusTitle} accessibilityRole="header">
            You’re safe!
          </Text>
          <Text style={styles.statusBody}>
            Assembly point A at {clockTime(me.safe_at)}
            {me.gps_verified ? ', confirmed by GPS' : ''}.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(350)}>
          <Text style={styles.section}>Your office{office?.company ? `, ${office.company}` : ''}</Text>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : !office ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <>
              <Text style={styles.count}>
                <Text style={styles.countNum}>
                  {here} of {people.length}
                </Text>{' '}
                have checked in
              </Text>
              <ListCard>
                {people.map((p, i) => (
                  <Animated.View key={`${p.name}-${i}`} entering={FadeInDown.delay(300 + i * 140).duration(300)}>
                    <ListRow
                      first={i === 0}
                      initials={initials(p.name)}
                      tone={p.safe ? 'navy' : 'muted'}
                      title={p.me ? `${p.name} (you)` : p.name}
                      right={p.safe ? <Pill tone="safe" label="Here" /> : <Pill tone="wait" label="Not yet" />}
                    />
                  </Animated.View>
                ))}
              </ListCard>
              <Text style={styles.hint}>Someone missing? Tell security. Don’t go back inside.</Text>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.dock}>
        <AppButton label="Back to guidance" variant="outline" onPress={() => router.replace('/evacuate')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: space.xl, gap: space.xl },
  mascot: { alignItems: 'center', marginBottom: -space.sm },
  status: {
    gap: space.md + 2,
    padding: space.xl + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.success,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: { ...type.title, color: colors.onPrimary },
  statusBody: { fontSize: 17, lineHeight: 24, color: colors.onPrimary },
  section: {
    ...type.bodyStrong,
    fontSize: 15,
    color: colors.inkMuted,
    marginBottom: space.xs,
  },
  count: { ...type.body, color: colors.inkMuted, marginBottom: space.md },
  countNum: { fontWeight: '700', color: colors.ink },
  hint: { ...type.small, color: colors.inkMuted, marginTop: space.md },
  error: { ...type.small, color: colors.danger },
  dock: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: colors.background,
  },
});
