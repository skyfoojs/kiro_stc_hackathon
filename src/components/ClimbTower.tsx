import { HardHat } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space } from '@/constants/theme';

const FLOORS = 38;

// Cut-through of the tower: the staging floor (two below the fire), your
// floor, and the Bomba team climbing. `bomba` is a floor number or null.
export function ClimbTower({ myFloor, stagingFloor, bomba }: { myFloor: number; stagingFloor: number; bomba: number | null }) {
  const pct = (f: number) => `${(f / FLOORS) * 100}%` as const;
  return (
    <View style={styles.card} importantForAccessibility="no-hide-descendants">
      <View style={styles.tw}>
        {Array.from({ length: FLOORS }, (_, i) => (
          <View key={i} style={[styles.tick, { bottom: pct(i + 1) }]} />
        ))}
        <View style={[styles.flr, styles.stg, { bottom: pct(stagingFloor) }]} />
        <Text style={[styles.tag, styles.tagStg, { bottom: pct(stagingFloor) }]}>Staging L{stagingFloor}</Text>
        <View style={[styles.flr, styles.you, { bottom: pct(myFloor) }]} />
        <Text style={[styles.tag, styles.tagYou, { bottom: pct(myFloor) }]}>You, L{myFloor}</Text>
        {bomba !== null ? (
          <View style={[styles.bm, { bottom: pct(bomba) }]}>
            <HardHat color={colors.ink} size={16} strokeWidth={2.6} />
          </View>
        ) : null}
      </View>
      <Text style={styles.ground}>Ground</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingTop: space.md,
    paddingHorizontal: space.sm + 2,
    paddingBottom: 30,
  },
  tw: {
    flex: 1,
    minHeight: 230,
    marginLeft: 4,
    marginRight: 74,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.background,
  },
  flr: {
    position: 'absolute',
    left: -4,
    right: -4,
    height: 7,
    borderRadius: 3,
    transform: [{ translateY: 3.5 }],
  },
  you: { backgroundColor: colors.alert },
  stg: { backgroundColor: colors.inkMuted, opacity: 0.55 },
  tag: {
    position: 'absolute',
    left: '100%',
    marginLeft: 8,
    fontSize: 10.5,
    fontWeight: '800',
    width: 70,
    transform: [{ translateY: 7 }],
  },
  tagYou: { color: '#C2410C' },
  tagStg: { color: colors.inkMuted },
  bm: {
    position: 'absolute',
    left: -1,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: 14 }],
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  ground: {
    position: 'absolute',
    bottom: 8,
    left: space.sm + 2,
    fontSize: 12,
    color: colors.inkMuted,
  },
});
