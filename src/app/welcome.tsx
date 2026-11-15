import { useRouter } from 'expo-router';
import { DoorOpen, Hand, UserRound, Users } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/AppButton';
import { Ping, PingBust } from '@/components/Ping';
import { colors, radius, space, type } from '@/constants/theme';

const HOW = [
  { icon: Hand, text: 'Say if you’d need help on stairs', orange: true },
  { icon: Users, text: 'Rescue teams are told where you wait' },
  { icon: DoorOpen, text: 'Check in safe at the assembly point' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.wordmark} accessibilityRole="header">
          <PingBust size={44} />
          <View>
            <Text style={styles.brand}>Relay</Text>
            <Text style={styles.place}>The Vertical, Bangsar South</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.mascot}>
          <Ping pose="wave" size={160} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Text style={styles.title}>Know who’s out.{'\n'}Reach who isn’t.</Text>
          <Text style={styles.sub}>Emergency check-in for your building.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.how}>
          {HOW.map(({ icon: Icon, text, orange }) => (
            <View key={text} style={styles.howRow}>
              <View style={[styles.howIcon, orange && styles.howIconOrange]}>
                <Icon color={colors.onPrimary} size={18} strokeWidth={2.4} />
              </View>
              <Text style={styles.howText}>{text}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      <View style={styles.dock}>
        <AppButton label="Sign in" onPress={() => router.push('/sign-in')} />
        <AppButton label="Use a demo account" variant="outline" icon={UserRound} onPress={() => router.push('/demo')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.xl, paddingTop: space.xxl, gap: space.xl },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  brand: { fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.5, color: colors.ink },
  place: { ...type.small, color: colors.inkMuted },
  mascot: { alignItems: 'center' },
  title: { ...type.title, color: colors.ink },
  sub: { ...type.body, color: colors.inkMuted, marginTop: space.sm },
  how: { gap: space.md },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  howIcon: { width: 34, height: 34, borderRadius: radius.sm + 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  howIconOrange: { backgroundColor: colors.alert },
  howText: { ...type.bodyStrong, fontSize: 15, color: colors.ink },
  dock: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.lg, gap: space.sm + 2 },
});
