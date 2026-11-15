import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { colors, space, type } from '@/constants/theme';
import { signOut } from '@/lib/auth';
import { IncidentProvider } from '@/lib/incident-context';
import { useSession } from '@/lib/session';

const takeover = { presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false } as const;

export default function AppLayout() {
  const { profile, profileError, reloadProfile } = useSession();

  if (profileError) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Couldn’t load your profile</Text>
        <Text style={styles.body}>{profileError}</Text>
        <View style={styles.actions}>
          <AppButton label="Try again" onPress={reloadProfile} />
          <AppButton label="Sign out" variant="outline" onPress={signOut} />
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} size="large" />
      </View>
    );
  }

  return (
    <IncidentProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="report" />
        <Stack.Screen name="map" />
        <Stack.Screen name="alert" options={{ ...takeover, contentStyle: { backgroundColor: colors.alert } }} />
        <Stack.Screen name="alarm" options={{ ...takeover, contentStyle: { backgroundColor: colors.alarm } }} />
        <Stack.Screen name="evacuate" options={{ gestureEnabled: false }} />
        <Stack.Screen name="help" options={{ gestureEnabled: false }} />
        <Stack.Screen name="help-status" options={{ gestureEnabled: false }} />
        <Stack.Screen name="checkin" />
        <Stack.Screen name="safe" options={{ gestureEnabled: false }} />
        <Stack.Screen name="ended" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
    </IncidentProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.md, backgroundColor: colors.background },
  title: { ...type.heading, color: colors.ink, textAlign: 'center' },
  body: { ...type.body, color: colors.inkMuted, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: space.md, marginTop: space.lg },
});
