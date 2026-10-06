import { useAuthStore } from '@/store/authstore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { apiRequest } from '../../services/api';

export default function ChooseUsernameScreen() {
  const { mode } = useLocalSearchParams();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const { user, profile, loading: authLoading, fetchProfile } = useAuthStore();

  const normalizedUsername = username.trim().toLowerCase();

  const usernamePrefillKey = user
    ? `${user.id}|${user.fullName ?? ''}|${user.email ?? ''}|${mode}|${profile?.username ?? ''}`
    : null;
  const [appliedPrefillKey, setAppliedPrefillKey] = useState<string | null>(null);

  if (usernamePrefillKey && appliedPrefillKey !== usernamePrefillKey) {
    const source = user as NonNullable<typeof user>;
    setAppliedPrefillKey(usernamePrefillKey);
    if (mode === 'edit' && profile?.username) {
      setUsername(profile.username);
    } else {
      const displayName = source.fullName || '';
      const email = source.email || '';
      let defaultUsername = '';

      if (displayName) {
        defaultUsername = displayName.toLowerCase().replace(/\s+/g, '');
      } else if (email) {
        defaultUsername = email.split('@')[0].toLowerCase();
      }

      defaultUsername = defaultUsername.slice(0, 15);
      if (!defaultUsername) {
        defaultUsername = 'user_' + source.id.slice(0, 6);
      }
      setUsername(defaultUsername);
    }
  }

  // Check username availability (debounced)
  useEffect(() => {
    if (!user) return;

    const checkAvailability = async () => {
      if (!normalizedUsername || normalizedUsername.length < 3) {
        setIsAvailable(null);
        return;
      }

      setChecking(true);
      try {
        const data = await apiRequest<{ available: boolean }>(
          `/usernames/availability?username=${encodeURIComponent(normalizedUsername)}`,
        );
        setIsAvailable(data.available);
      } catch (err) {
        console.error('Username check failed:', err);
        setIsAvailable(null);
      } finally {
        setChecking(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [normalizedUsername, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      Alert.alert('Session expired', 'Please sign in again.');
      router.replace('/(auth)/login');
    }
  }, [authLoading, router, user]);

  const handleContinue = async () => {
    if (!normalizedUsername || normalizedUsername.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    if (normalizedUsername.length > 30) {
      Alert.alert('Error', 'Username must be less than 30 characters');
      return;
    }

    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      Alert.alert(
        'Error',
        'Username can only contain letters, numbers, and underscores'
      );
      return;
    }

    if (checking || isAvailable !== true) {
      Alert.alert('Unavailable', 'Choose an available username first.');
      return;
    }

    setLoading(true);
    try {
      if (!user) return;

      // Update the profile with the chosen username
      await apiRequest('/me/username', {
        method: 'PATCH',
        body: JSON.stringify({ username: normalizedUsername }),
      });

      // Refresh the profile in the store
      await fetchProfile(user!.id);

      // Navigate to main app
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              <Ionicons name="camera" size={32} color={COLORS.primary} />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {mode == 'edit' ? 'Modify Username' : 'One Last Step'}
            </Text>
            <Text style={styles.subtitle}>
              Choose a unique username to represent you on the leaderboard and
              in the community.
            </Text>
          </View>

          {/* Form */}
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

              {/* Availability Indicator */}
              {checking && (
                <View style={styles.statusContainer}>
                  <ActivityIndicator size="small" color={COLORS.tertiary} />
                  <Text style={styles.statusText}>
                    Checking availability...
                  </Text>
                </View>
              )}

              {isAvailable === true && (
                <View style={styles.statusContainer}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.statusText, styles.successText]}>
                    Username is available!
                  </Text>
                </View>
              )}

              {isAvailable === false && username.length >= 3 && (
                <View style={styles.statusContainer}>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text style={[styles.statusText, styles.errorText]}>
                    Username is already taken
                  </Text>
                </View>
              )}

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
              title={mode == 'register' ? 'START EXPLORING' : 'Submit'}
              onPress={handleContinue}
              loading={loading}
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              }
              disabled={
                normalizedUsername.length < 3 ||
                checking ||
                isAvailable !== true
              }
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.tertiary },
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

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.tertiary,
  },
  successText: {
    color: '#10B981',
  },
  errorText: {
    color: '#EF4444',
  },
  hintText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    fontSize: 13,
    color: COLORS.tertiary,
  },
});
