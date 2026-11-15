import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '@/constants/theme';

type Props = { title: string; back?: boolean | (() => void); right?: ReactNode };

export function AppBar({ title, back, right }: Props) {
  const router = useRouter();
  const onBack = typeof back === 'function' ? back : () => router.back();

  return (
    <View style={styles.bar}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <ChevronLeft color={colors.ink} size={26} strokeWidth={2.4} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm },
  back: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: 'rgba(20,33,61,0.08)' },
  spacer: { width: space.sm },
  title: { ...type.heading, fontSize: 20, color: colors.ink, flex: 1 },
});
