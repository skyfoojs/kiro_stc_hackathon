import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, DoorOpen, Locate } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/AppBar';
import { AppButton } from '@/components/AppButton';
import { EmergencyBar, LEAVE_STEPS, NEEDS_STEPS } from '@/components/EmergencyBar';
import { FloorRadar } from '@/components/FloorRadar';
import { Note } from '@/components/Note';
import { colors, ICON_STROKE, radius, space, type } from '@/constants/theme';
import { useIncident } from '@/lib/incident-context';
import { checkInAtAssembly, floorName } from '@/lib/incidents';

// DEMO: "finding you with GPS" is simulated; the check-in itself is real.
const GPS_MS = 1800;

export default function CheckInScreen() {
  const router = useRouter();
  const { active, refresh } = useIncident();
  const [found, setFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setFound(true), GPS_MS);
    return () => clearTimeout(t);
  }, []);

  if (!active) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.ink} size="large" />
      </View>
    );
  }

  const { incident, assembly_point: point, help_request: help } = active;
  const helped = !!help && (help.status === 'open' || help.status === 'acknowledged');

  const checkIn = async () => {
    if (!point) return;
    setBusy(true);
    setError(null);
    try {
      await checkInAtAssembly(incident.id, point);
      await refresh();
      router.replace('/safe');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not check you in.');
      setBusy(false);
    }
  };

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <EmergencyBar
        kind={incident.type}
        place={floorName(incident.floor_level, incident.floor_label)}
        tower={incident.tower_name}
        startedAt={incident.started_at}
        progress={helped ? { labels: NEEDS_STEPS, current: 3 } : { labels: LEAVE_STEPS, current: 2 }}
      />
      <AppBar title="Check in as safe" back />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card} accessibilityLiveRegion="polite">
          {!found ? (
            <View style={styles.big}>
              <View style={styles.radar}>
                <FloorRadar size={60} tint="#74E2AA" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.findingText}>Finding you with GPS</Text>
                <Text style={styles.small}>Scanning for the assembly point</Text>
              </View>
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(250)} style={styles.foundWrap}>
              <View style={styles.big}>
                <View style={[styles.bigIcon, styles.bigIconSafe]}>
                  <DoorOpen color={colors.onPrimary} size={30} strokeWidth={2.4} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.small}>GPS found you at</Text>
                  <Text style={styles.place}>Assembly point A</Text>
                  <Text style={styles.small}>Front plaza, outside the main entrance</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <Locate color={colors.ink} size={20} strokeWidth={ICON_STROKE} />
                </View>
                <Text style={styles.rowText}>
                  Within <Text style={styles.bold}>12 m</Text> of the point
                </Text>
                <Check color={colors.success} size={22} strokeWidth={3} />
              </View>
            </Animated.View>
          )}
        </View>

        <Note>If someone from your floor is missing, tell security. Don’t go back inside.</Note>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.dock}>
        <AppButton label="I’m safe" variant="safe" size="lg" icon={Check} disabled={!found || !point} loading={busy} onPress={checkIn} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    gap: space.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg + 2,
  },
  foundWrap: { gap: space.md + 2 },
  big: { flexDirection: 'row', alignItems: 'center', gap: space.md + 2 },
  bigIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigIconSafe: { backgroundColor: colors.success },
  radar: { width: 60, height: 60, borderRadius: 18, overflow: 'hidden' },
  findingText: { fontSize: 20, fontWeight: '700', color: colors.ink },
  small: { ...type.small, color: colors.inkMuted },
  place: { fontSize: 21, lineHeight: 25, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { ...type.body, color: colors.ink, flex: 1 },
  bold: { fontWeight: '700' },
  error: { ...type.small, color: colors.danger },
  dock: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: colors.background,
  },
});
