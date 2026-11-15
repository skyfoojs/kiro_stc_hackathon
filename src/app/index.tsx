import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Relay</Text>
      <Link href="/command" style={styles.link}>
        Open Relay Command (management)
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  link: {
    fontSize: 17,
    fontWeight: '700',
    color: '#14213D',
    textDecorationLine: 'underline',
    padding: 12,
  },
});
