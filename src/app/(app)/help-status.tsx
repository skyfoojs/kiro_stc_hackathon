import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, HardHat, Shield, UserRound, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { ClimbTower } from '@/components/ClimbTower';
import { EmergencyBar, NEEDS_STEPS } from '@/components/EmergencyBar';
import { Pill } from '@/components/Pill';
import { colors, radius, space, type } from '@/constants/theme';
import { useIncident } from '@/lib/incident-context';
import { cancelHelp, floorName } from '@/lib/incidents';

// DEMO: replies and the Bomba climb are simulated, counted from when the
// request was sent. Six real minutes play in about 11 seconds.
const SECURITY_ACK_MS = 1800;
const BOMBA_ACK_MS = 4200;
const CLIMB_MS = 11000;

type Climb = { title: string; floor: number | null; eta: string; pill: string };

function climbState(since: number, myFloor: number, staging: number): Climb {
  if (since < BOMBA_ACK_MS) return { title: 'Alerting rescue teams', floor: null, eta: '', pill: '' };
  const p = Math.min(1, (since - BOMBA_ACK_MS) / CLIMB_MS);
  if (p < 0.4) {
    const m = Math.max(1, Math.ceil(6 * (1 - p / 0.4)));
    return {
      title: `Bomba are ${m} min away`,
      floor: 0,
      eta: `${m} min`,
      pill: 'On the way',
    };
  }
  if (p < 0.8)
    return {
      title: 'Bomba are in the building',
      floor: (staging * (p - 0.4)) / 0.4,
      eta: 'Inside',
      pill: 'Coming up',
    };
  if (p < 1)
    return {
      title: `Bomba are on Level ${staging}`,
      floor: staging + ((myFloor - staging) * (p - 0.8)) / 0.2,
      eta: 'Inside',
      pill: 'Coming to you',
    };
  return {
    title: 'Bomba are on your floor',
    floor: myFloor,
    eta: 'Here',
    pill: 'On your floor',
  };
}

function TeamRow({ icon: Icon, name, on, label }: { icon: LucideIcon; name: string; on: boolean; label: string }) {
  return (
    <View style={styles.team}>
      <View style={styles.teamIcon}>
        <Icon color={colors.onPrimary} size={22} strokeWidth={2.2} />
      </View>
      <Text style={styles.teamName}>{name}</Text>
      {on ? <Pill tone="safe" label={label} /> : <Pill tone="wait" label="Alerting" busy />}
    </View>
  );
}

export default function HelpStatusScreen() {
  const router = useRouter();
  const { active, loading, refresh } = useIncident();
  const [now, setNow] = useState(() => Date.now());
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const help = active?.help_request;
  const helpOpen = !!help && (help.status === 'open' || help.status === 'acknowledged');

  useEffect(() => {
    if (!loading && (!active || active.me.state === 'safe' || !helpOpen)) router.replace('/evacuate');
  }, [loading, active, helpOpen, router]);

  if (!active || !help || !helpOpen) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.ink} size="large" />
      </View>
    );
  }

  const { incident, me } = active;
  const myFloor = me.floor_level ?? 22;
  const staging = Math.max(1, (incident.floor_level ?? myFloor) - 2);
  const since = now - new Date(help.created_at).getTime();
  const climb = climbState(since, myFloor, staging);
  const helperOn = help.status === 'acknowledged';

  const cancel = async () => {
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

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <EmergencyBar
        kind={incident.type}
        place={floorName(incident.floor_level, incident.floor_label)}
        tower={incident.tower_name}
        startedAt={incident.started_at}
        progress={{ labels: NEEDS_STEPS, current: 2 }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(350)}>
          <Text style={styles.title} accessibilityRole="header" accessibilityLiveRegion="polite">
            {climb.title}
          </Text>
          <Text style={styles.sub}>You’re on {floorName(myFloor)}. Stay where you are.</Text>
        </Animated.View>

        <View style={styles.climb}>
          <ClimbTower myFloor={myFloor} stagingFloor={staging} bomba={climb.floor} />
          <View style={styles.side}>
            <TeamRow icon={Shield} name="Security" on={since > SECURITY_ACK_MS} label="Has your location" />
            <TeamRow icon={HardHat} name="Bomba" on={since > BOMBA_ACK_MS} label={climb.pill} />
            {since > BOMBA_ACK_MS ? (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.eta}>
                <Text style={styles.etaLabel}>Arrives in</Text>
                <Text style={styles.etaValue}>{climb.eta}</Text>
              </Animated.View>
            ) : null}
            {helperOn ? <TeamRow icon={UserRound} name="Your helper" on label={help.arrived_at ? 'With you' : 'On the way'} /> : null}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable accessibilityRole="button" onPress={cancel} disabled={cancelling} hitSlop={8} style={styles.cancel}>
          <Text style={styles.cancelText}>{cancelling ? 'Cancelling…' : 'Cancel my help request'}</Text>
        </Pressable>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.dock}>
        <AppButton label="I’m safe now" icon={Check} onPress={() => router.push('/checkin')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: space.xl, paddingTop: space.lg, gap: space.md + 2 },
  title: { ...type.title, color: colors.ink },
  sub: { ...type.body, color: colors.inkMuted, marginTop: space.xs + 2 },
  climb: { flexDirection: 'row', gap: space.md + 2, alignItems: 'stretch' },
  side: { flex: 1, gap: space.sm + 2 },
  team: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs + 2,
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: { fontSize: 17, fontWeight: '700', color: colors.ink },
  eta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md + 2,
  },
  etaLabel: { ...type.small, color: colors.inkMuted },
  etaValue: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  error: { ...type.small, color: colors.danger },
  cancel: { alignSelf: 'flex-start', paddingVertical: space.xs },
  cancelText: {
    ...type.bodyStrong,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  dock: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: colors.background,
  },
});
