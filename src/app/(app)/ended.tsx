import { useRouter } from 'expo-router';
import { Sun } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/AppBar';
import { AppButton } from '@/components/AppButton';
import { Ping } from '@/components/Ping';
import { colors, radius, space, type } from '@/constants/theme';
import { fetchIncidentSummary } from '@/lib/incidents';
import { clockTime, incidentName } from '@/lib/labels';
import type { IncidentSummary } from '@/types/incident';

type Entry = { at: string; title: string; sub?: string };

function timeline(s: IncidentSummary): Entry[] {
  const name = incidentName(s.type);
  const out: Entry[] = [
    { at: s.started_at, title: `${name} alert received`, sub: `${s.floor_label ?? ''}, ${s.tower_name}` },
  ];
  if (s.help) {
    out.push({ at: s.help.created_at, title: 'Help requested for you', sub: 'Stairwell B waiting point' });
    if (s.help.acknowledged_at) {
      const secs = Math.round((new Date(s.help.acknowledged_at).getTime() - new Date(s.help.created_at).getTime()) / 1000);
      out.push({ at: s.help.acknowledged_at, title: 'Rescue teams acknowledged', sub: `First reply after ${secs} seconds` });
    }
    if (s.help.arrived_at) out.push({ at: s.help.arrived_at, title: 'Your helper reached you' });
    if (s.help.cancelled_at) out.push({ at: s.help.cancelled_at, title: 'You cancelled your help request' });
  }
  if (s.safe_at) out.push({ at: s.safe_at, title: 'Checked in safe', sub: s.assembly_point ?? undefined });
  if (s.resolved_at) out.push({ at: s.resolved_at, title: 'All clear', sub: 'Ended by UOA security' });
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export default function EndedScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<IncidentSummary | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidentSummary()
      .then(setSummary)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load your timeline.'));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <AppBar title="All clear" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.mascot}>
          <Ping pose="mug" state="safe" size={124} />
        </View>

        <Animated.View entering={FadeInDown.duration(350)} style={styles.status}>
          <View style={styles.ring}>
            <Sun color={colors.onPrimary} size={32} strokeWidth={2.4} />
          </View>
          <Text style={styles.statusTitle} accessibilityRole="header">
            The incident is over
          </Text>
          <Text style={styles.statusBody}>
            {summary?.resolved_at
              ? `UOA security ended the ${incidentName(summary.type).toLowerCase()} alert at ${clockTime(summary.resolved_at)}. `
              : ''}
            Wait for security before going back inside.
          </Text>
        </Animated.View>

        <View>
          <Text style={styles.section}>Your timeline</Text>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : summary === undefined ? (
            <ActivityIndicator color={colors.ink} />
          ) : summary === null ? (
            <Text style={styles.empty}>Nothing to show yet.</Text>
          ) : (
            <View style={styles.steps}>
              {timeline(summary).map((e, i, all) => (
                <Animated.View key={`${e.at}-${e.title}`} entering={FadeInDown.delay(60 + i * 50).duration(300)} style={[styles.step, i < all.length - 1 && styles.stepDivider]}>
                  <View style={styles.num}>
                    <Text style={styles.numText}>{i + 1}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.stepTitle}>
                      {clockTime(e.at)} {e.title}
                    </Text>
                    {e.sub ? <Text style={styles.stepSub}>{e.sub}</Text> : null}
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.dock}>
        <AppButton label="Back to home" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.xl },
  mascot: { alignItems: 'center', marginBottom: -space.sm },
  status: { gap: space.md + 2, padding: space.xl + 2, borderRadius: radius.lg, backgroundColor: colors.success },
  ring: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  statusTitle: { ...type.title, color: colors.onPrimary },
  statusBody: { fontSize: 17, lineHeight: 24, color: colors.onPrimary },
  section: { ...type.bodyStrong, fontSize: 15, color: colors.inkMuted, marginBottom: space.sm },
  steps: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space.lg },
  step: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
  stepDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  num: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 15, fontWeight: '800', color: colors.onPrimary },
  stepTitle: { ...type.step, color: colors.ink },
  stepSub: { ...type.small, color: colors.inkMuted },
  empty: { ...type.body, color: colors.inkMuted },
  error: { ...type.small, color: colors.danger },
  dock: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.lg },
});
