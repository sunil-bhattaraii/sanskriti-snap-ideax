import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="camera" size={28} color={COLORS.primary} />
        <Text style={styles.logo}>Sanskriti Snap</Text>
      </View>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>
        Build this screen with your heritage discovery feed.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.neutral,
    paddingHorizontal: 24,
    paddingTop: 64,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.tertiary,
    lineHeight: 22,
  },
});