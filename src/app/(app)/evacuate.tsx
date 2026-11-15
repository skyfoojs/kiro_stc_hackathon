import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, CircleCheck, DoorOpen, Hand, House } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { EmergencyBar, LEAVE_STEPS, NEEDS_STEPS } from '@/components/EmergencyBar';
import { Level22Map } from '@/components/Level22Map';
import { FloorTracker } from '@/components/FloorTracker';
import { LiveShareChip } from '@/components/LiveShareChip';
import { colors, ICON_STROKE, radius, space, type } from '@/constants/theme';
import { useIncident } from '@/lib/incident-context';
import { cancelHelp, floorName, requestHelp } from '@/lib/incidents';
import { clearDeclinedHelp, hasDeclinedHelp } from '@/lib/useAutoHelp';

// Standard evacuation steps, used when someone with an assistance profile says
// they don't need help this time (the server sends them the waiting-point steps).
const LEAVE_GUIDANCE = {
  title: 'Evacuate now',
  steps: ['Leave now by the nearest stairwell', 'Don’t use the lifts', 'Go to Assembly point A and check in', 'Don’t go back inside'],
  details: [
    'Stairwell A or B. Keep left so others can pass.',
    'The Bomba lift is for firefighters only.',
    'Front plaza on Jalan Kerinchi, outside the main entrance.',
    'Leave your belongings behind.',
  ],
};

const UNDO_MS = 5000;

// Floors already found this session, so coming back doesn't re-run the radar.
const locatedIncidents = new Set<string>();

function UndoBar({ helpId, createdAt, onDone }: { helpId: string; createdAt: string; onDone: () => Promise<void> }) {
  // Time left is fixed when the bar first appears.
  const [left] = useState(() => Math.max(0, UNDO_MS - (Date.now() - new Date(createdAt).getTime())));
  const [open, setOpen] = useState(left > 0);
  const [busy, setBusy] = useState(false);
  const bar = useSharedValue(left / UNDO_MS);

  useEffect(() => {
    if (left <= 0) return;
    bar.value = withTiming(0, { duration: left, easing: Easing.linear });
    const t = setTimeout(() => setOpen(false), left);
    return () => clearTimeout(t);
    // Runs once: the countdown is fixed when the bar appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));
  if (!open) return null;

  return (
    <Animated.View exiting={FadeOut.duration(200)} style={styles.undo}>
      <View style={styles.flex}>
        <Text style={styles.undoText}>Sent by mistake?</Text>
        <View style={styles.undoTrack}>
          <Animated.View style={[styles.undoFill, style]} />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Undo help request"
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await cancelHelp(helpId);
            await onDone();
          } finally {
            setBusy(false);
          }
        }}
        style={styles.undoBtn}
      >
        <Text style={styles.undoBtnText}>{busy ? '…' : 'Undo'}</Text>
      </Pressable>
    </Animated.View>
  );
}

// One screen during an emergency: find your floor, then what to do and the
// route out, with the help request status on top when there is one.
export default function EvacuateScreen() {
  const router = useRouter();
  const { active, loading, refresh } = useIncident();
  const incidentId = active?.incident.id;
  const [located, setLocated] = useState(() => !!incidentId && locatedIncidents.has(incidentId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const declined = !!incidentId && hasDeclinedHelp(incidentId);
  const lateHelpId = declined && active?.help_request && active.help_request.status === 'open' ? active.help_request.id : null;

  // Declined while the automatic request was still on its way: cancel it once it lands.
  useEffect(() => {
    if (!lateHelpId) return;
    cancelHelp(lateHelpId)
      .then(refresh)
      .catch(() => {});
  }, [lateHelpId, refresh]);

  if (!active) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        {loading ? (
          <ActivityIndicator color={colors.ink} size="large" />
        ) : (
          <View style={styles.allClear}>
            <CircleCheck color={colors.success} size={48} strokeWidth={ICON_STROKE} />
            <Text style={styles.allClearTitle}>All clear</Text>
            <AppButton label="Back to home" icon={House} onPress={() => router.replace('/')} />
          </View>
        )}
      </SafeAreaView>
    );
  }

  const { incident, me, help_request: help } = active;
  const isSafe = me.state === 'safe';
  const helpOpen = !!help && (help.status === 'open' || help.status === 'acknowledged');
  const waiting = helpOpen || (me.needs_assistance && !declined);
  const guidance = me.needs_assistance && declined && !helpOpen ? LEAVE_GUIDANCE : active.guidance;
  const steps = guidance?.steps ?? [];
  const details = guidance?.details ?? [];
  const myFloor = me.floor_level ?? incident.floor_level ?? 22;

  const onLocated = () => {
    locatedIncidents.add(incident.id);
    setLocated(true);
  };

  const askForHelp = async () => {
    setBusy(true);
    setError(null);
    try {
      clearDeclinedHelp(incident.id);
      await requestHelp(incident.id);
      await refresh();
      router.push('/help');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your help request.');
    } finally {
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
        progress={helpOpen ? { labels: NEEDS_STEPS, current: 2 } : { labels: LEAVE_STEPS, current: isSafe ? 3 : 1, done: isSafe }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {isSafe ? (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/safe')} style={[styles.banner, styles.bannerSafe]}>
              <CircleCheck color={colors.success} size={22} strokeWidth={ICON_STROKE} />
              <View style={styles.flex}>
                <Text style={styles.bannerTitle}>You’re checked in as safe</Text>
                <Text style={styles.bannerBody}>Stay at the assembly point until the all clear.</Text>
              </View>
              <ChevronRight color={colors.ink} size={20} strokeWidth={ICON_STROKE} />
            </Pressable>
          </Animated.View>
        ) : helpOpen && help ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.helpBlock}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/help-status')} style={[styles.banner, styles.bannerHelp]}>
              <Hand color={colors.alert} size={22} strokeWidth={ICON_STROKE} />
              <View style={styles.flex}>
                <Text style={styles.bannerTitle}>{help.status === 'acknowledged' ? 'Help is on the way' : 'Help request sent'}</Text>
                <Text style={styles.bannerBody}>
                  {me.needs_assistance ? 'Sent automatically from your profile. ' : ''}
                  See who’s coming.
                </Text>
              </View>
              <ChevronRight color={colors.ink} size={20} strokeWidth={ICON_STROKE} />
            </Pressable>
            <UndoBar key={help.id} helpId={help.id} createdAt={help.created_at} onDone={refresh} />
          </Animated.View>
        ) : null}

        <View style={styles.locate}>
          <LiveShareChip ready={located} />
          {located ? (
            <Animated.View
              entering={FadeIn.duration(250)}
              style={styles.locatedRow}
              accessibilityLabel={`You're on ${floorName(myFloor)}, estimated from air pressure`}
            >
              <Text style={styles.locatedCaption}>You’re on</Text>
              <Text style={styles.locatedFloor}>L{myFloor}</Text>
              <Text style={styles.locatedHint}>from GPS and air pressure</Text>
            </Animated.View>
          ) : (
            <FloorTracker floor={myFloor} onLocated={onLocated} />
          )}
        </View>

        {located ? (
          <>
            <Animated.Text entering={FadeInDown.duration(350)} style={styles.title} accessibilityRole="header">
              {guidance?.title ?? 'Evacuate now'}
            </Animated.Text>

            <Animated.View entering={FadeInDown.delay(60).duration(400)}>
              <Level22Map mode={waiting ? 'wait' : 'evacuate'} floorLabel={floorName(myFloor)} />
            </Animated.View>

            <View style={styles.steps}>
              {steps.map((step, i) => (
                <Animated.View key={step} entering={FadeInDown.delay(60 + i * 60).duration(350)} style={styles.step}>
                  <View style={styles.num}>
                    <Text style={styles.numText}>{i + 1}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.stepTitle}>{step}</Text>
                    {details[i] ? <Text style={styles.stepDetail}>{details[i]}</Text> : null}
                  </View>
                </Animated.View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.dock}>
        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        {isSafe ? (
          <AppButton label="Back to home" variant="outline" icon={House} onPress={() => router.replace('/')} />
        ) : (
          <>
            {!helpOpen ? (
              <AppButton
                label="I need help"
                subtitle="Alerts the control room and rescue teams"
                variant="alert"
                size="xl"
                icon={Hand}
                loading={busy}
                onPress={askForHelp}
              />
            ) : null}
            <AppButton label={helpOpen ? 'I’m safe now' : 'I’m leaving'} icon={DoorOpen} onPress={() => router.push('/checkin')} />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  allClear: {
    alignItems: 'center',
    gap: space.md,
    padding: space.xxl,
    alignSelf: 'stretch',
  },
  allClearTitle: { ...type.title, color: colors.ink, marginBottom: space.lg },
  scroll: { padding: space.xl, paddingTop: space.lg, gap: space.lg },
  helpBlock: { gap: space.sm },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  bannerSafe: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  bannerHelp: { backgroundColor: colors.alertSoft, borderColor: colors.alert },
  bannerTitle: { ...type.bodyStrong, color: colors.ink },
  bannerBody: { ...type.small, color: colors.inkMuted },
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.sm + 2,
    paddingLeft: space.lg,
    paddingRight: space.sm + 2,
  },
  undoText: { ...type.small, fontSize: 15, color: colors.onPrimary },
  undoTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 6,
    overflow: 'hidden',
  },
  undoFill: { height: 4, backgroundColor: colors.alert },
  undoBtn: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: space.md + 2,
    minHeight: 44,
    justifyContent: 'center',
  },
  undoBtnText: { fontSize: 16, fontWeight: '800', color: colors.ink },
  locate: { gap: space.sm },
  locatedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  locatedCaption: {
    ...type.caption,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  locatedFloor: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.ink,
  },
  locatedHint: { ...type.small, color: colors.inkMuted, flex: 1 },
  title: { ...type.title, color: colors.ink },
  steps: { gap: space.md },
  step: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  num: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontSize: 15, fontWeight: '800', color: colors.onPrimary },
  stepTitle: { ...type.step, color: colors.ink },
  stepDetail: { ...type.small, color: colors.inkMuted, marginTop: 1 },
  section: {
    ...type.bodyStrong,
    fontSize: 15,
    color: colors.inkMuted,
    marginBottom: space.sm,
  },
  dock: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    gap: space.sm + 2,
    backgroundColor: colors.background,
  },
  error: { ...type.small, color: colors.danger, textAlign: 'center' },
});
