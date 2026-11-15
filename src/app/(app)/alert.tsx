import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertPulse, SoundToggle } from '@/components/AlertChrome';
import { AppButton } from '@/components/AppButton';
import { SirenRings } from '@/components/SirenRings';
import { colors, space, type } from '@/constants/theme';
import { useIncident } from '@/lib/incident-context';
import { floorName } from '@/lib/incidents';
import { incidentName } from '@/lib/labels';
import { useAutoHelp } from '@/lib/useAutoHelp';
import { useSiren } from '@/lib/useSiren';

// The reporter's own alert: centred takeover, siren, flashing edge, one fact, one instruction.
export default function AlertScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { active, loading } = useIncident();
  const { auto, decline } = useAutoHelp();
  const siren = useSiren();

  useEffect(() => {
    Vibration.vibrate([0, 400, 150, 400, 150, 400]);
    return () => Vibration.cancel();
  }, []);

  useEffect(() => {
    if (!loading && !active) router.replace('/');
  }, [loading, active, router]);

  if (!active) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.onAlert} size="large" />
      </View>
    );
  }

  const { incident } = active;
  const name = incidentName(incident.type);
  const where = `${floorName(incident.floor_level, incident.floor_label)}, ${incident.tower_name}`;

  const noHelp = async () => {
    siren.stop();
    await decline();
    router.replace('/evacuate');
  };

  const go = () => {
    siren.stop();
    router.replace(auto ? '/help' : '/evacuate');
  };

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <AlertPulse />
      <SoundToggle on={siren.on} onPress={siren.toggle} />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + space.xxxl + space.lg,
            paddingBottom: insets.bottom + space.xxl,
          },
        ]}
      >
        <View style={styles.body} accessible accessibilityRole="alert" accessibilityLabel={`${name}. ${where}. Evacuate now.`}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.siren}>
            <SirenRings kind={incident.type} />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(80).duration(350)} style={styles.kind} adjustsFontSizeToFit numberOfLines={1}>
            {name}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(130).duration(350)} style={styles.where}>
            {where}
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.what}>
            <View style={styles.rule} />
            <Text style={styles.whatText}>Evacuate now</Text>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(230).duration(350)} style={styles.sub}>
            {auto ? 'We’re sending your request for help now.' : 'Everyone in the building has been alerted.'}
          </Animated.Text>
        </View>
        <Animated.View entering={FadeInDown.delay(280).duration(350)} style={styles.actions}>
          <AppButton label={auto ? 'See my help request' : 'Show me what to do'} variant="light" size="lg" onPress={go} />
          {auto ? <AppButton label="I don’t need help" variant="outlineLight" onPress={noHelp} /> : null}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.alert, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: space.xl + 2 },
  actions: { gap: space.sm + 2 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  siren: { marginBottom: space.xxl - 2 },
  kind: {
    fontSize: 64,
    lineHeight: 68,
    fontWeight: '800',
    letterSpacing: -1.3,
    color: colors.onAlert,
    textAlign: 'center',
  },
  where: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.onAlert,
    textAlign: 'center',
    marginTop: space.md,
  },
  what: { marginTop: space.xxl, alignItems: 'center', alignSelf: 'stretch' },
  rule: { width: 64, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.45)', marginBottom: space.lg },
  whatText: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.onAlert, letterSpacing: -0.3 },
  sub: {
    ...type.heading,
    color: colors.onAlert,
    textAlign: 'center',
    marginTop: space.lg + 2,
    maxWidth: 290,
  },
});
