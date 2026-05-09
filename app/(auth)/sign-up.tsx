import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useColors, ColorScheme } from '@/hooks/useColors';

export default function SignUp() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirm) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Please make sure your passwords match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Please verify your email before signing in.'
      );
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🌸</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start your mood tracking journey</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.subtext}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.subtext}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={colors.subtext}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    inner: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
      gap: 12,
    },
    emoji: { fontSize: 64, textAlign: 'center', marginBottom: 8 },
    title: { fontSize: 34, fontWeight: '700', color: c.primary, textAlign: 'center' },
    subtitle: { fontSize: 15, color: c.subtext, textAlign: 'center', marginBottom: 24 },
    input: {
      backgroundColor: c.card,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    linkButton: { alignItems: 'center', paddingVertical: 12 },
    linkText: { color: c.primary, fontSize: 14, fontWeight: '500' },
  });
}
