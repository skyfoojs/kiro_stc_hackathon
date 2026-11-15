import { useRouter } from 'expo-router';
import { ChevronRight, DoorOpen, Footprints, Hand, LogOut, Map as MapIcon, MapPin, TriangleExclamationPoint } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/AppBar';
import { AppButton } from '@/components/AppButton';
import { IncidentIcon } from '@/components/IncidentIcon';
import { ListCard, ListRow } from '@/components/ListRow';
import { PingBust } from '@/components/Ping';
import { TowerStrip } from '@/components/TowerStrip';
import { colors, ICON_STROKE, radius, space, type } from '@/constants/theme';
import { signOut } from '@/lib/auth';
import { useIncident } from '@/lib/incident-context';
import { fetchMyAssistance } from '@/lib/incidents';
import { incidentName } from '@/lib/labels';
import { useSession } from '@/lib/session';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useSession();
  const { active, loading, error, refresh } = useIncident();
  const [needsHelp, setNeedsHelp] = useState<boolean | null>(null);

  useEffect(() => {
    if (!profile) return;
    fetchMyAssistance(profile.id)
      .then((a) => setNeedsHelp(!!a))
      .catch(() => setNeedsHelp(false));
  }, [profile]);

  if (!profile) return null;

  const first = profile.full_name.split(' ')[0];
  const level = profile.floor?.level ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <AppBar
        title={`Hi ${first}`}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={signOut}
            hitSlop={8}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <LogOut color={colors.ink} size={20} strokeWidth={ICON_STROKE} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {active ? (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${incidentName(active.incident.type)} in your building. Open instructions`}
              onPress={() => router.push('/evacuate')}
              style={({ pressed }) => [styles.alertCard, pressed && styles.pressed]}
            >
              <View style={styles.alertTile}>
                <IncidentIcon kind={active.incident.type} color={colors.onAlert} size={24} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.alertTitle}>{incidentName(active.incident.type)}: evacuate now</Text>
                <Text style={styles.alertSub}>Tap for what to do</Text>
              </View>
              <ChevronRight color={colors.onAlert} size={22} strokeWidth={ICON_STROKE} />
            </Pressable>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(40).duration(400)} style={styles.place}>
          <View style={styles.placeFloors}>
            <TowerStrip myFloor={level} showCaption={false} light />
          </View>
          <Text style={styles.placeSmall}>You’re signed in at</Text>
          <Text style={styles.placeLevel}>
            <Text style={styles.placeLevelWord}>Level </Text>
            {level}
          </Text>
          <Text style={styles.placeTower}>{profile.tower?.name}</Text>
          {profile.company ? <Text style={styles.placeSmall}>{profile.company.name}</Text> : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.calm}>
          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : error ? (
            <Text style={styles.calmText} onPress={refresh}>
              Can’t check for emergencies. Tap to retry.
            </Text>
          ) : (
            <>
              <PingBust size={40} state={active ? 'alert' : 'standby'} />
              <Text style={styles.calmText}>{active ? 'Emergency in your building' : 'No emergency right now'}</Text>
            </>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Text style={styles.section}>Your plan</Text>
          {needsHelp === null ? (
            <ActivityIndicator color={colors.ink} />
          ) : needsHelp ? (
            <ListCard>
              <ListRow first icon={MapPin} tone="alert" title="Stairwell B waiting point" subtitle="Where you wait if you can’t take the stairs" />
              <ListRow icon={Hand} title="Help is requested for you" subtitle="Sent automatically when an emergency starts" />
              <ListRow icon={DoorOpen} title="Assembly point A" subtitle="Front plaza, outside the main entrance" />
            </ListCard>
          ) : (
            <ListCard>
              <ListRow first icon={Footprints} tone="navy" title="Stairwell A or B" subtitle="Your nearest routes down" />
              <ListRow icon={DoorOpen} title="Assembly point A" subtitle="Front plaza. Check in when you get there." />
            </ListCard>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={styles.actions}>
          <AppButton label="Floor map" variant="outline" icon={MapIcon} onPress={() => router.push('/map')} />
          <AppButton
            label="Report an emergency"
            variant="outline"
            icon={TriangleExclamationPoint}
            onPress={() => router.push('/report')}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.xl },
  flex: { flex: 1 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: space.xs },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.alert },
  alertTile: { width: 44, height: 44, borderRadius: radius.sm + 4, backgroundColor: colors.onAlertTile, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { ...type.bodyStrong, fontSize: 17, color: colors.onAlert },
  alertSub: { ...type.small, color: colors.onAlertMuted },
  place: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: space.xl, overflow: 'hidden', minHeight: 160 },
  placeFloors: { position: 'absolute', right: 18, top: 18, bottom: 18 },
  placeSmall: { ...type.small, color: colors.onPrimaryMuted },
  placeLevel: { fontSize: 64, lineHeight: 66, fontWeight: '800', letterSpacing: -2.5, color: colors.onPrimary, fontVariant: ['tabular-nums'] },
  placeLevelWord: { fontSize: 22, fontWeight: '700', letterSpacing: 0, color: colors.onPrimaryMuted },
  placeTower: { fontSize: 17, fontWeight: '700', color: colors.onPrimary, marginTop: space.xs },
  calm: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 2, minHeight: 44 },
  calmText: { ...type.bodyStrong, color: colors.ink },
  section: { ...type.bodyStrong, fontSize: 15, color: colors.inkMuted, marginBottom: space.sm },
  actions: { gap: space.md },
});
