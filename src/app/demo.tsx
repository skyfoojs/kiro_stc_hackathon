import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/AppBar';
import { ListCard, ListRow } from '@/components/ListRow';
import { Note } from '@/components/Note';
import { colors, ICON_STROKE, space, type } from '@/constants/theme';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, signIn } from '@/lib/auth';

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function DemoScreen() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (username: string) => {
    if (busy) return;
    setBusy(username);
    setError(null);
    try {
      await signIn(username, DEMO_PASSWORD);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppBar title="Demo login" back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Choose a demo account</Text>
          <Text style={styles.sub}>Each one opens Relay as that person.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <ListCard>
            {DEMO_ACCOUNTS.map((a, i) => (
              <ListRow
                key={a.username}
                first={i === 0}
                initials={initials(a.name)}
                tone={a.tone === 'alert' ? 'alert' : 'navy'}
                title={a.name}
                subtitle={a.description}
                onPress={() => choose(a.username)}
                right={
                  busy === a.username ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <ChevronRight color={colors.inkSubtle} size={20} strokeWidth={ICON_STROKE} />
                  )
                }
              />
            ))}
          </ListCard>
        </Animated.View>

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <Note>UOA security and the Bomba commander use the Command view, not this app.</Note>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: space.xl, gap: space.xl },
  title: { ...type.title, color: colors.ink },
  sub: { ...type.body, color: colors.inkMuted, marginTop: space.xs + 2 },
  error: { ...type.small, color: colors.danger },
});
