import { useRouter } from 'expo-router';
import { UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/AppBar';
import { AppButton } from '@/components/AppButton';
import { TextField } from '@/components/TextField';
import { colors, space, type } from '@/constants/theme';
import { signIn } from '@/lib/auth';

export default function SignInScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(username, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppBar title="Sign in" back />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <View style={styles.form}>
            <TextField
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              placeholder="e.g. aisyah"
            />
            <TextField
              label="Password"
              secret
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              placeholder="Password"
            />
            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}
          </View>
        </ScrollView>
        <View style={styles.dock}>
          <AppButton label="Sign in" onPress={submit} loading={busy} />
          <AppButton label="Use a demo account" variant="outline" icon={UserRound} onPress={() => router.push('/demo')} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: space.xl, paddingTop: space.xxl, gap: space.xl },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  brand: { fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.5, color: colors.ink },
  place: { ...type.small, color: colors.inkMuted },
  sub: { ...type.body, color: colors.inkMuted, marginTop: space.sm },
  title: { ...type.title, color: colors.ink },
  form: { gap: space.md },
  error: { ...type.small, color: colors.danger },
  dock: { paddingHorizontal: space.xl, paddingBottom: space.lg, paddingTop: space.md, gap: space.sm + 2 },
});
