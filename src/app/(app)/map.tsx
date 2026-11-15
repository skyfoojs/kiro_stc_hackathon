import { Check, DoorOpen, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/AppBar';
import { FloorPlan, SitePlan } from '@/components/FloorPlan';
import { colors, radius, space, type } from '@/constants/theme';

type View_ = 'floor' | 'site';

type Item = { swatch: React.ReactNode; title: string; sub: string };

const sw = (bg: string, child: React.ReactNode, dashed?: boolean) => (
  <View style={[styles.swatch, { backgroundColor: bg }, dashed && styles.swatchDashed]}>{child}</View>
);
const letter = (t: string, color: string = colors.onPrimary) => <Text style={[styles.swatchText, { color }]}>{t}</Text>;

const floorItems = (): Item[] => [
  { swatch: sw(colors.primary, letter('A')), title: 'Stairwell A', sub: 'North-west corner' },
  { swatch: sw(colors.primary, letter('B')), title: 'Stairwell B', sub: 'South-east corner' },
  { swatch: sw(colors.alert, <MapPin color="#fff" size={16} strokeWidth={2.6} />), title: 'Waiting point', sub: 'Beside Stairwell B. Wait here. Rescuers will come to you.' },
  { swatch: sw(colors.inkMuted, letter('L')), title: 'Bomba lift lobby', sub: 'For firefighters only' },
  { swatch: sw(colors.surface, letter('C', colors.inkMuted), true), title: 'Evacuation chair', sub: 'Recommended here. None installed yet.' },
];

const siteItems = (): Item[] => [
  { swatch: sw(colors.success, <Check color="#fff" size={16} strokeWidth={3} />), title: 'Assembly point A', sub: 'Front plaza on Jalan Kerinchi. Check in here.' },
  { swatch: sw(colors.primary, <DoorOpen color="#fff" size={16} strokeWidth={2.4} />), title: 'Main entrance', sub: 'Both stairwells come out at ground level' },
];

export default function MapScreen() {
  const [view, setView] = useState<View_>('floor');
  const items = view === 'floor' ? floorItems() : siteItems();

  return (
    <SafeAreaView style={styles.safe}>
      <AppBar title="Level 22 map" back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.seg} accessibilityRole="tablist">
          {(['floor', 'site'] as const).map((v) => (
            <Pressable
              key={v}
              accessibilityRole="tab"
              accessibilityState={{ selected: view === v }}
              onPress={() => setView(v)}
              style={[styles.segBtn, view === v && styles.segOn]}
            >
              <Text style={[styles.segText, view === v && styles.segTextOn]}>{v === 'floor' ? 'Level 22' : 'Outside'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>{view === 'floor' ? <FloorPlan /> : <SitePlan />}</View>

        <View style={styles.legend}>
          {items.map((it, i) => (
            <View key={it.title} style={[styles.legendRow, i > 0 && styles.legendDivider]}>
              {it.swatch}
              <View style={styles.flex}>
                <Text style={styles.legendTitle}>{it.title}</Text>
                <Text style={styles.legendSub}>{it.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.lg },
  flex: { flex: 1 },
  seg: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md - 2, padding: 4, gap: 4 },
  segBtn: { flex: 1, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.primary },
  segText: { ...type.bodyStrong, fontSize: 15, color: colors.ink },
  segTextOn: { color: colors.onPrimary },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md },
  legend: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space.lg },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  legendDivider: { borderTopWidth: 1, borderTopColor: colors.background },
  swatch: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  swatchDashed: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.inkMuted },
  swatchText: { fontSize: 13, fontWeight: '800' },
  legendTitle: { ...type.bodyStrong, fontSize: 15, color: colors.ink },
  legendSub: { ...type.small, color: colors.inkMuted },
});
