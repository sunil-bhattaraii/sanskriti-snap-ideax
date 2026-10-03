import { Ionicons } from '@expo/vector-icons';
import { useClerk, useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { useGoogleSignIn } from '../../services/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();
  const googleSignIn = useGoogleSignIn();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isAnyLoading = registerLoading || googleLoading;

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setRegisterLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: fullName,
      });
      if (signUp.status !== 'complete' || !signUp.createdSessionId) {
        throw new Error(
          `Registration is incomplete (${signUp.status}). Check your email for the required verification, then try again.`,
        );
      }
      await setActive({ session: signUp.createdSessionId });

      router.replace({
        pathname: '/(auth)/choose-username',
        params: {
          mode: 'register',
        },
      });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      await googleSignIn();
      router.replace({
        pathname: '/(auth)/choose-username',
        params: {
          mode: 'register',
        },
      });
    } catch (error: any) {
      Alert.alert('Google Sign-Up Failed', error.message);
    } finally {
      setGoogleLoading(false);
    }
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
          <View style={styles.header}>
            <Ionicons name="camera" size={28} color={COLORS.primary} />
            <Text style={styles.logoText}>Sanskriti Snap</Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Start your cultural journey</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.input}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.tertiary}
                />
                <TextInput
                  style={styles.inputText}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.placeholder}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!isAnyLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.input}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.tertiary}
                />
                <TextInput
                  style={styles.inputText}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isAnyLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.input}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.tertiary}
                />
                <TextInput
                  style={styles.inputText}
                  placeholder="Create a password"
                  placeholderTextColor={COLORS.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isAnyLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.input}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.tertiary}
                />
                <TextInput
                  style={styles.inputText}
                  placeholder="Confirm your password"
                  placeholderTextColor={COLORS.placeholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!isAnyLoading}
                />
              </View>
            </View>

            <Button
              title="CREATE ACCOUNT"
              onPress={handleRegister}
              loading={registerLoading}
              disabled={isAnyLoading}
              variant="primary"
              size="lg"
              fullWidth
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.line} />
            </View>

            <Button
              title="Sign up with Google"
              onPress={handleGoogleSignUp}
              loading={googleLoading}
              disabled={isAnyLoading}
              variant="outline"
              size="lg"
              fullWidth
              leftIcon={
                <Ionicons name="logo-google" size={20} color="#4285F4" />
              }
              style={{ borderColor: '#E2E8F0' }}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                disabled={isAnyLoading}
              >
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
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
  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.tertiary,
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  inputText: { flex: 1, fontSize: 16, color: COLORS.text },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 16, color: COLORS.tertiary, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: COLORS.tertiary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});