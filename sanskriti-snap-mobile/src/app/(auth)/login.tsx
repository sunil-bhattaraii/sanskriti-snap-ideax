import { Ionicons } from '@expo/vector-icons';
import { useClerk, useSignIn } from '@clerk/expo';
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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const googleSignIn = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isAnyLoading = loginLoading || googleLoading;

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoginLoading(true);
    try {
      await signIn.create({ identifier: email, password });
      if (signIn.status !== 'complete' || !signIn.createdSessionId) {
        throw new Error('Additional sign-in verification is required.');
      }
      await setActive({ session: signIn.createdSessionId });
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await googleSignIn();
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error.message);
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
            <Text style={styles.title}>
              Your Heritage{'\n'}Collection Awaits
            </Text>
            <Text style={styles.subtitle}>
              Sign in to save discoveries, earn XP, and complete cultural
              quests.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
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
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isAnyLoading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() =>
                Alert.alert(
                  'Password reset',
                  'Please use the password reset flow configured in your Clerk account.',
                )
              }
              disabled={isAnyLoading}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleEmailLogin}
              loading={loginLoading}
              disabled={isAnyLoading}
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              }
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.line} />
            </View>

            <Button
              title="Sign in with Google"
              onPress={handleGoogleLogin}
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
              <Text style={styles.footerText}>
                Don&apos;t have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                disabled={isAnyLoading}
              >
                <Text style={styles.footerLink}>Register</Text>
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
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 16, color: COLORS.tertiary, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: COLORS.tertiary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});