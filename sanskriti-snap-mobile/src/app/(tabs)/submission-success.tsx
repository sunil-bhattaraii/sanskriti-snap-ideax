import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';

export default function SubmissionSuccessScreen() {
  const router = useRouter();
  const { artifactName, xpAwarded } = useLocalSearchParams<{
    artifactName?: string;
    xpAwarded?: string;
  }>();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={48} color={COLORS.white} />
      </View>
      <Text style={styles.title}>Discovery Complete</Text>
      <Text style={styles.artifactName}>
        {artifactName || 'Heritage artifact'}
      </Text>
      <Text style={styles.message}>
        Your visit was verified and added to your collection.
      </Text>
      <Text style={styles.xp}>+{xpAwarded || '0'} XP</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="View Collection"
          onPress={() => router.replace('/(tabs)/collection')}
          fullWidth
          leftIcon={
            <Ionicons name="albums-outline" size={20} color={COLORS.white} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.neutral,
    padding: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38A169',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  artifactName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
  },
  message: {
    fontSize: 16,
    color: COLORS.tertiary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  xp: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 20,
  },
  buttonContainer: { width: '100%', marginTop: 40 },
});
