import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/colors';

export default function ChooseUsernameScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [username, setUsername] = useState('');

  const normalizedUsername = username.trim().toLowerCase();
  const isValid =
    normalizedUsername.length >= 3 && /^[a-z0-9_]+$/.test(normalizedUsername);

  const handleContinue = () => {
    if (!normalizedUsername || normalizedUsername.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    if (normalizedUsername.length > 30) {
      Alert.alert('Error', 'Username must be less than 30 characters');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
      Alert.alert(
        'Error',
        'Username can only contain letters, numbers, and underscores'
      );
      return;
    }

    Alert.alert(
      'Not connected yet',
      'Wire up your auth API to save the username.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              <Ionicons name="camera" size={32} color={COLORS.primary} />
            </View>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {mode === 'edit' ? 'Modify Username' : 'One Last Step'}
            </Text>
            <Text style={styles.subtitle}>
              Choose a unique username to represent you on the leaderboard and
              in the community.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.input}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Username"
                  placeholderTextColor={COLORS.placeholder}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                />
              </View>

              <Text style={styles.hintText}>
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color={COLORS.tertiary}
                />{' '}
                Username must be at least 3 characters.
              </Text>
            </View>

            <Button
              title={mode === 'register' ? 'START EXPLORING' : 'Submit'}
              onPress={handleContinue}
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              }
              disabled={!isValid}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.neutral },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },

  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  titleSection: { marginBottom: 32, alignItems: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },

  form: { width: '100%' },
  inputContainer: { marginBottom: 24 },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputText: { fontSize: 16, color: COLORS.text },

  hintText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    fontSize: 13,
    color: COLORS.tertiary,
  },
});