import { StyleSheet, Text, View } from 'react-native';

import { colors, type } from '@/constants/theme';

type Props = { floors?: number; incidentFloor?: number | null; myFloor: number; showCaption?: boolean; light?: boolean };

// Narrow tower diagram: every floor as a bar, the incident floor in orange, yours in white.
export function TowerStrip({ floors = 38, incidentFloor, myFloor, showCaption = true, light }: Props) {
  const levels = Array.from({ length: floors }, (_, i) => floors - i);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${floors} floors.${incidentFloor ? ` Emergency on level ${incidentFloor}.` : ''} You are on level ${myFloor}.`}
    >
      <View style={[styles.tower, light && styles.towerLight]}>
        {levels.map((level) => {
          const fire = level === incidentFloor;
          const me = level === myFloor;
          return (
            <View key={level} style={[styles.floor, light && styles.floorLight, fire && styles.fire, me && styles.me, fire && me && styles.fireMe]} />
          );
        })}
      </View>
      {showCaption ? (
        <Text style={styles.caption}>
          <Text style={styles.you}>You</Text>
          {'\n'}L{myFloor}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tower: { width: 58, padding: 6, gap: 2, backgroundColor: colors.primary, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  towerLight: { width: 34, padding: 0, backgroundColor: 'transparent' },
  floor: { height: 5, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.16)' },
  floorLight: { flex: 1, height: undefined, backgroundColor: 'rgba(255,255,255,0.14)' },
  fire: { backgroundColor: colors.alert },
  me: { backgroundColor: colors.onPrimary },
  fireMe: { backgroundColor: colors.alert, borderWidth: 1.5, borderColor: colors.onPrimary },
  caption: { ...type.small, fontSize: 12, lineHeight: 15, color: colors.inkMuted, textAlign: 'center', marginTop: 6 },
  you: { fontWeight: '700', color: colors.ink },
});
