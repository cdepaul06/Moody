import { useMemo, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { useColors, ColorScheme } from '@/hooks/useColors';

export default function ChangePasswordScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!current || !next || !confirm) { Alert.alert('Please fill in all fields.'); return; }
    if (next !== confirm) { Alert.alert('New passwords do not match.'); return; }
    if (next.length < 6) { Alert.alert('Password must be at least 6 characters.'); return; }
    if (next === current) { Alert.alert('New password must be different from your current password.'); return; }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: session?.user?.email ?? '',
      password: current,
    });
    if (authError) {
      Alert.alert('Incorrect current password', 'Please check your current password and try again.');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) {
      Alert.alert('Could not update password', error.message);
    } else {
      Alert.alert('Password updated', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.description}>
          To keep your account secure, confirm your current password before setting a new one.
        </Text>

        <Text style={styles.label}>Current Password</Text>
        <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.subtext} value={current} onChangeText={setCurrent} secureTextEntry />

        <Text style={styles.label}>New Password</Text>
        <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.subtext} value={next} onChangeText={setNext} secureTextEntry />

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.subtext} value={confirm} onChangeText={setConfirm} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleChange} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 20, gap: 8 },
    description: { fontSize: 14, color: c.subtext, lineHeight: 21, marginBottom: 16 },
    label: {
      fontSize: 13, fontWeight: '600', color: c.subtext,
      textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8, marginBottom: 6,
    },
    input: {
      backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 15, color: c.text, borderWidth: 1, borderColor: c.border,
    },
    button: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
}
