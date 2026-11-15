import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CommandConsole from '@/components/command/CommandConsole';

/** Relay Command: the management and Bomba commander console. Desktop web first; runs in a webview on phones. */
export default function CommandRoute() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false, title: 'Relay – Command' }} />
      <CommandConsole dom={{ style: styles.fill, scrollEnabled: true }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14213D' },
  fill: { flex: 1 },
});
