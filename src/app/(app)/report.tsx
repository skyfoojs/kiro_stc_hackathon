import { Check, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/AppBar';
import { HoldToReport } from '@/components/HoldToReport';
import { colors, ICON_STROKE, radius, space, type } from '@/constants/theme';
import { useIncident } from '@/lib/incident-context';
import { floorName } from '@/lib/incidents';
import { REPORT_OPTIONS, type ReportType } from '@/lib/labels';
import { useSession } from '@/lib/session';

// DEMO: "finding where you are" is simulated; the floor comes from the profile.
const LOCATE_MS = 1400;

export default function ReportScreen() {
  const { profile } = useSession();
  const { report } = useIncident();
  const [kind, setKind] = useState<ReportType | null>(null);
  const [located, setLocated] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLocated(true), LOCATE_MS);
    return () => clearTimeout(t);
  }, []);

  const send = async () => {
    if (!kind) return;
    setSending(true);
    setError(null);
    try {
      await report(kind);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not report the emergency.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppBar title="Report an emergency" back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title} accessibilityRole="header" nativeID="what">
          What’s happening?
        </Text>

        <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabelledBy="what">
          {REPORT_OPTIONS.map(({ type: t, label, icon: Icon }, i) => {
            const on = kind === t;
            return (
              <Animated.View key={t} entering={FadeInDown.delay(i * 50).duration(350)}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={label}
                  onPress={() => setKind(t)}
                  style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.pressed]}
                >
                  <View style={[styles.optionIcon, on && styles.optionIconOn]}>
                    <Icon color={on ? colors.onPrimary : colors.ink} size={24} strokeWidth={ICON_STROKE} />
                  </View>
                  <Text style={styles.optionLabel}>{label}</Text>
                  {on ? (
                    <View style={styles.tick}>
                      <Check color={colors.onPrimary} size={16} strokeWidth={3.2} />
                    </View>
                  ) : null}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <View style={styles.loc} accessibilityLiveRegion="polite">
          <View style={[styles.locIcon, located && styles.locIconOn]}>
            <MapPin color={located ? colors.onPrimary : colors.ink} size={20} strokeWidth={ICON_STROKE} />
          </View>
          {located ? (
            <Animated.View entering={FadeIn.duration(250)} style={styles.flex}>
              <Text style={styles.locTitle}>
                {floorName(profile?.floor?.level, profile?.floor?.label)}, {profile?.tower?.name}
              </Text>
              <Text style={styles.locSub}>Found with GPS and the barometer</Text>
            </Animated.View>
          ) : (
            <View style={[styles.flex, styles.locFinding]}>
              <Text style={styles.locTitle}>Finding where you are</Text>
              <ActivityIndicator color={colors.inkMuted} />
            </View>
          )}
          {located ? <Check color={colors.success} size={22} strokeWidth={3} /> : null}
        </View>
      </ScrollView>

      <View style={styles.dock}>
        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        <HoldToReport
          onConfirm={send}
          loading={sending}
          disabled={!kind || !located}
          label={kind ? 'Hold to report' : 'Choose what’s happening'}
        />
        <Text style={styles.footnote}>Everyone in the building is told to evacuate.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.lg },
  flex: { flex: 1 },
  title: { ...type.title, fontSize: 24, color: colors.ink },
  options: { gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    minHeight: 68,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionOn: { borderColor: colors.ink },
  pressed: { opacity: 0.9 },
  optionIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  optionIconOn: { backgroundColor: colors.primary },
  optionLabel: { ...type.heading, color: colors.ink, flex: 1 },
  tick: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  loc: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md + 2, borderRadius: radius.md, backgroundColor: colors.surface },
  locIcon: { width: 36, height: 36, borderRadius: radius.md - 2, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  locIconOn: { backgroundColor: colors.primary },
  locFinding: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  locTitle: { ...type.bodyStrong, color: colors.ink },
  locSub: { ...type.small, color: colors.inkMuted },
  dock: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.lg, gap: space.sm },
  footnote: { ...type.small, color: colors.inkMuted, textAlign: 'center' },
  error: { ...type.small, color: colors.danger, textAlign: 'center' },
});
