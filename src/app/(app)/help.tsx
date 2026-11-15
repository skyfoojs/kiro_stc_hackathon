import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, Gauge, Locate, MapPin, Minus, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { BaroGauge } from '@/components/BaroGauge';
import { EmergencyBar, NEEDS_STEPS } from '@/components/EmergencyBar';
import { colors, ICON_STROKE, radius, space, type } from '@/constants/theme';
import { useIncident } from '@/lib/incident-context';
import { cancelHelp, floorName, reportLocation } from '@/lib/incidents';

// DEMO timings from the prototype: skeleton, then the barometer needle climbs,
// then the floor is shown and the screen moves on by itself.
const READ_AT = 900;
const FOUND_AT = 2400;
const ADVANCE_AT = 5600;
const UNDO_MS = 5000;
const METRES_PER_FLOOR = 3.9;

type Phase = 0 | 1 | 2;

function Skeleton({ width }: { width: `${number}%` }) {
  return <View style={[styles.skel, { width }]} />;
}

export default function HelpSentScreen() {
  const router = useRouter();
  const { active, loading, refresh } = useIncident();
  const [phase, setPhase] = useState<Phase>(0);
  const [metres, setMetres] = useState(0);
  const [manual, setManual] = useState(false);
  const [floor, setFloor] = useState<number | null>(null);
  const [undoOpen, setUndoOpen] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bar = useSharedValue(1);
  const manualRef = useRef(false);

  const help = active?.help_request;
  const helpOpen = !!help && (help.status === 'open' || help.status === 'acknowledged');
  const homeFloor = active?.me.floor_level ?? 22;
  const shownFloor = floor ?? homeFloor;
  const altitude = Math.round(shownFloor * METRES_PER_FLOOR);
  const incidentId = active?.incident.id;

  useEffect(() => {
    bar.value = withTiming(0, { duration: UNDO_MS, easing: Easing.linear });
    const timers = [
      setTimeout(() => setPhase(1), READ_AT),
      setTimeout(() => setPhase(2), FOUND_AT),
      setTimeout(() => setUndoOpen(false), UNDO_MS),
      setTimeout(() => {
        if (!manualRef.current) router.replace('/help-status');
      }, ADVANCE_AT),
    ];
    return () => timers.forEach(clearTimeout);
  }, [bar, router]);

  // Count the height up while the needle climbs.
  useEffect(() => {
    if (phase !== 1) return;
    const target = Math.round(homeFloor * METRES_PER_FLOOR);
    const t0 = Date.now();
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / 1300);
      setMetres(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k >= 1) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [phase, homeFloor]);

  // Send the barometer estimate to the control room once it's found.
  useEffect(() => {
    if (phase === 2 && incidentId) reportLocation(incidentId, homeFloor, 'barometer', homeFloor).catch(() => {});
  }, [phase, incidentId, homeFloor]);

  useEffect(() => {
    if (!loading && (!active || active.me.state === 'safe' || (help && !helpOpen))) router.replace('/evacuate');
  }, [loading, active, help, helpOpen, router]);

  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));

  if (!active || !help || !helpOpen) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.ink} size="large" />
        <Text style={styles.waiting}>Sending your help request…</Text>
      </View>
    );
  }

  const { incident, me } = active;

  const undo = async () => {
    setCancelling(true);
    setError(null);
    try {
      await cancelHelp(help.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel. Try again.');
      setCancelling(false);
    }
  };

  const chooseFloor = () => {
    manualRef.current = true;
    setManual(true);
    setFloor(homeFloor);
  };

  const confirm = async () => {
    if (manual && floor !== null) {
      reportLocation(incident.id, floor, 'manual', null).catch(() => {});
    }
    router.replace('/help-status');
  };

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <EmergencyBar
        kind={incident.type}
        place={floorName(incident.floor_level, incident.floor_label)}
        tower={incident.tower_name}
        startedAt={incident.started_at}
        progress={{ labels: NEEDS_STEPS, current: 1 }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View>
          <Text style={styles.title} accessibilityRole="header">
            Help request sent
          </Text>
          <Text style={styles.sub}>
            {me.needs_assistance ? 'Sent automatically from your profile. ' : ''}
            The control room and rescue teams have it.
          </Text>
        </View>

        {undoOpen ? (
          <Animated.View exiting={FadeOut.duration(200)} style={styles.undo} accessibilityLiveRegion="polite">
            <View style={styles.flex}>
              <Text style={styles.undoText}>Sent by mistake?</Text>
              <View style={styles.undoTrack}>
                <Animated.View style={[styles.undoFill, barStyle]} />
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Undo help request" onPress={undo} disabled={cancelling} style={styles.undoBtn}>
              <Text style={styles.undoBtnText}>{cancelling ? '…' : 'Undo'}</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={styles.loc} accessibilityLiveRegion="polite">
          {phase === 0 ? (
            <>
              <View style={styles.big}>
                <View style={styles.sw}>
                  <MapPin color={colors.onPrimary} size={30} strokeWidth={ICON_STROKE} />
                </View>
                <View style={[styles.flex, styles.skelStack]}>
                  <Text style={styles.bigText}>Finding where you are</Text>
                  <Skeleton width="70%" />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.ri}>
                  <Locate color={colors.ink} size={20} strokeWidth={ICON_STROKE} />
                </View>
                <Skeleton width="60%" />
              </View>
            </>
          ) : (
            <Animated.View entering={FadeIn.duration(250)} style={styles.locInner}>
              <View style={styles.big}>
                <BaroGauge metres={altitude} animate={phase === 1} />
                <View style={styles.flex}>
                  {phase === 1 ? (
                    <>
                      <Text style={styles.small}>Reading air pressure</Text>
                      <Text style={styles.reading}>{metres} m up</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.small}>Your location</Text>
                      <Text style={styles.reading}>Level {shownFloor}</Text>
                      <Text style={styles.small}>
                        About {altitude} m up, {incident.tower_name}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.ri}>
                  <Locate color={colors.ink} size={20} strokeWidth={ICON_STROKE} />
                </View>
                <Text style={styles.rowText}>Phone found the tower</Text>
                <Check color={colors.success} size={22} strokeWidth={3} />
              </View>
              <View style={styles.row}>
                <View style={styles.ri}>
                  <Gauge color={colors.ink} size={20} strokeWidth={ICON_STROKE} />
                </View>
                <Text style={styles.rowText}>{phase === 1 ? 'Barometer is working out your floor' : `Barometer says Level ${homeFloor}`}</Text>
                {phase === 2 ? <Check color={colors.success} size={22} strokeWidth={3} /> : <ActivityIndicator color={colors.inkMuted} />}
              </View>
            </Animated.View>
          )}
        </View>

        {phase === 2 ? (
          manual ? (
            <View style={styles.picker}>
              <Text style={styles.pickerLabel}>Choose your floor</Text>
              <View style={styles.stepper}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="One floor down"
                  onPress={() => setFloor((f) => Math.max(1, (f ?? homeFloor) - 1))}
                  style={styles.stepBtn}
                >
                  <Minus color={colors.ink} size={22} strokeWidth={2.6} />
                </Pressable>
                <Text style={styles.stepValue} accessibilityLiveRegion="polite">
                  Level {shownFloor}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="One floor up"
                  onPress={() => setFloor((f) => Math.min(38, (f ?? homeFloor) + 1))}
                  style={styles.stepBtn}
                >
                  <Plus color={colors.ink} size={22} strokeWidth={2.6} />
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={chooseFloor} hitSlop={8} style={styles.linkWrap}>
              <Text style={styles.link}>Not right? Choose my floor</Text>
            </Pressable>
          )
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.dock}>
        <AppButton label={phase === 2 && !manual ? 'Looks right, continue' : 'Looks right'} disabled={phase !== 2} onPress={confirm} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: space.md },
  waiting: { ...type.body, color: colors.inkMuted },
  flex: { flex: 1 },
  scroll: { padding: space.xl, gap: space.lg },
  title: { ...type.title, color: colors.ink },
  sub: { ...type.body, color: colors.inkMuted, marginTop: space.xs + 2 },
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
  loc: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg + 2,
    gap: space.md + 2,
  },
  locInner: { gap: space.md + 2 },
  big: { flexDirection: 'row', alignItems: 'center', gap: space.md + 2 },
  sw: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigText: { fontSize: 20, fontWeight: '700', color: colors.ink },
  skelStack: { gap: space.sm },
  skel: { height: 14, borderRadius: 7, backgroundColor: colors.background },
  small: { ...type.small, color: colors.inkMuted },
  reading: {
    ...type.title,
    lineHeight: 30,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  ri: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { ...type.body, color: colors.ink, flex: 1 },
  linkWrap: { alignSelf: 'flex-start' },
  link: {
    ...type.bodyStrong,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  picker: { gap: space.sm },
  pickerLabel: { ...type.bodyStrong, fontSize: 15, color: colors.ink },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    ...type.heading,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  error: { ...type.small, color: colors.danger },
  dock: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: colors.background,
  },
});
