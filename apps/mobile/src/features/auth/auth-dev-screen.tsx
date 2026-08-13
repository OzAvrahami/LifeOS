import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '@/lib/api/client';

import { useAuth } from './auth-provider';

type AuthMeResponse = {
  email: string | null;
  id: string;
};

export function AuthDevScreen() {
  const { isLoading, session, signIn, signOut, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [verification, setVerification] = useState<string>();

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setIsWorking(true);
    setVerification(undefined);
    try {
      await signIn({ email: email.trim(), password });
      setPassword('');
    } catch {
      setVerification('Sign in failed');
    } finally {
      setIsWorking(false);
    }
  };

  const handleSignOut = async () => {
    setIsWorking(true);
    setVerification(undefined);
    try {
      await signOut();
    } catch {
      setVerification('Sign out failed');
    } finally {
      setIsWorking(false);
    }
  };

  const handleAuthMe = async () => {
    setIsWorking(true);
    setVerification(undefined);
    try {
      const identity = await apiRequest<AuthMeResponse>('/auth/me', { auth: 'required' });
      setVerification(identity.id === user?.id ? 'API /auth/me: OK' : 'API identity mismatch');
    } catch {
      setVerification('API /auth/me: failed');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View accessibilityLabel="Development authentication verification" style={styles.card}>
          <Text style={styles.eyebrow}>DEVELOPMENT ONLY</Text>
          <Text accessibilityRole="header" style={styles.title}>Supabase Auth verification</Text>

          {isLoading ? (
            <ActivityIndicator accessibilityLabel="Restoring authentication session" />
          ) : session ? (
            <>
              <Text style={styles.status}>Signed in as: {user?.email ?? user?.id}</Text>
              <Pressable disabled={isWorking} onPress={handleAuthMe} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Call /auth/me</Text>
              </Pressable>
              <Pressable disabled={isWorking} onPress={handleSignOut} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Sign out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.status}>Signed out</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Email"
                style={styles.input}
                value={email}
              />
              <TextInput
                autoCapitalize="none"
                autoComplete="current-password"
                onChangeText={setPassword}
                onSubmitEditing={handleSignIn}
                placeholder="Password"
                secureTextEntry
                style={styles.input}
                value={password}
              />
              <Pressable disabled={isWorking} onPress={handleSignIn} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Sign in</Text>
              </Pressable>
            </>
          )}

          {isWorking ? <ActivityIndicator accessibilityLabel="Authentication request in progress" /> : null}
          {verification ? <Text style={styles.verification}>{verification}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f7f6f2', flex: 1 },
  keyboardView: { flex: 1, justifyContent: 'center', padding: 24 },
  card: {
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dedbd3',
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    maxWidth: 440,
    padding: 24,
    width: '100%',
  },
  eyebrow: { color: '#766f62', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#24211d', fontSize: 24, fontWeight: '700' },
  status: { color: '#3d3932', fontSize: 16 },
  input: {
    borderColor: '#cbc6bc',
    borderRadius: 10,
    borderWidth: 1,
    color: '#24211d',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#24211d',
    borderRadius: 10,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#cbc6bc',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: { color: '#24211d', fontSize: 16, fontWeight: '700' },
  verification: { color: '#275c43', fontSize: 15, fontWeight: '600' },
});
