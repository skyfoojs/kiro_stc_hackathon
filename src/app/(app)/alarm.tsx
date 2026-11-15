import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DoorOpen, Hand } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Vibration, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertPulse, SoundToggle } from '@/components/AlertChrome';
import { AppButton } from '@/components/AppButton';
import { IncidentIcon } from '@/components/IncidentIcon';
import { LedBorder } from '@/components/LedBorder';
import { colors, radius, space, type } from '@/constants/theme';
import { useIncident } from '@/lib/incident-context';
import { floorName } from '@/lib/incidents';
import { incidentName } from '@/lib/labels';
import { useAutoHelp } from '@/lib/useAutoHelp';
import { useSiren } from '@/lib/useSiren';

// Shown to everyone else in the building when someone reports an emergency.
export default function AlarmScreen() {
  const router = useRouter();
  const { active, loading } = useIncident();
  const { auto, decline } = useAutoHelp();
  const siren = useSiren();
  const insets = useSafeAreaInsets();
  const beat = useSharedValue(1);

  useEffect(() => {
    // Repeat until they act: long buzz, pause.
    Vibration.vibrate([0, 700, 500], true);
    beat.value = withRepeat(withSequence(withTiming(1.08, { duration: 350 }), withTiming(1, { duration: 350 })), -1, false);
    return () => Vibration.cancel();
  }, [beat]);

  useEffect(() => {
    if (!loading && !active) router.replace('/');
  }, [loading, active, router]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: beat.value }],
  }));

  if (!active) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.onAlert} size="large" />
      </View>
    );
  }

  const { incident } = active;
  const where = `${floorName(incident.floor_level, incident.floor_label)}, ${incident.tower_name}`;

  const noHelp = async () => {
    Vibration.cancel();
    siren.stop();
    await decline();
    router.replace('/evacuate');
  };

  const go = () => {
    Vibration.cancel();
    siren.stop();
    router.replace(auto ? '/help' : '/evacuate');
  };

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <LedBorder color={colors.alarmLed} glow={colors.onAlert} />
      <AlertPulse />
      <SoundToggle on={siren.on} onPress={siren.toggle} />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + space.xxxl + space.lg,
            paddingBottom: insets.bottom + space.xl,
          },
        ]}
      >
        <View
          style={styles.body}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${incidentName(incident.type)} reported on ${where}. Leave the building.`}
        >
          <Animated.View entering={FadeIn.duration(250)} style={[styles.tile, iconStyle]}>
            <IncidentIcon kind={incident.type} color={colors.onAlert} size={56} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(80).duration(350)} style={styles.kicker}>
            {incidentName(incident.type)} reported
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(140).duration(350)} style={styles.title}>
            Leave{'\n'}the building
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(200).duration(350)} style={styles.where}>
            {where}
          </Animated.Text>
          {auto ? (
            <Animated.Text entering={FadeInDown.delay(240).duration(350)} style={styles.sub}>
              We’re sending your request for help now.
            </Animated.Text>
          ) : null}
        </View>

        <Animated.View entering={FadeInDown.delay(260).duration(350)} style={styles.footer}>
          <AppButton label={auto ? 'See my help request' : 'Evacuate now'} variant="light" size="lg" icon={auto ? Hand : DoorOpen} onPress={go} />
          {auto ? <AppButton label="I don’t need help" variant="outlineLight" onPress={noHelp} /> : null}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.alarm, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: space.xxxl },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
  },
  tile: {
    width: 112,
    height: 112,
    borderRadius: radius.xl + 8,
    backgroundColor: colors.onAlertTile,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  kicker: {
    ...type.caption,
    color: colors.onAlertMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '900',
    color: colors.onAlert,
    textAlign: 'center',
  },
  where: {
    ...type.bodyStrong,
    color: colors.onAlertMuted,
    textAlign: 'center',
  },
  sub: { ...type.heading, color: colors.onAlert, textAlign: 'center' },
  footer: { paddingBottom: space.lg, gap: space.sm + 2 },
});
