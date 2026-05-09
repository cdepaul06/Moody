import { useMemo, useState } from 'react';
import {
  View,
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

export default function ChangeEmailScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) { Alert.alert('Enter a new email address.'); return; }
    if (trimmed === session?.user?.email) {
      Alert.alert('That is already your current email address.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    if (error) {
      Alert.alert('Could not update email', error.message);
    } else {
      Alert.alert(
        'Confirm your new email',
        `A confirmation link has been sent to ${trimmed}. Click it to complete the change.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
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
          Enter your new email address. You'll receive a confirmation link there before the change
          takes effect.
        </Text>

        <Text style={styles.label}>Current email</Text>
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyText}>{session?.user?.email}</Text>
        </View>

        <Text style={styles.label}>New email</Text>
        <TextInput
          style={styles.input}
          placeholder="new@example.com"
          placeholderTextColor={colors.subtext}
          value={newEmail}
          onChangeText={setNewEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleChange} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Confirmation</Text>}
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
    readOnlyField: { backgroundColor: c.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
    readOnlyText: { fontSize: 15, color: c.subtext },
    input: {
      backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 15, color: c.text, borderWidth: 1, borderColor: c.border,
    },
    button: { backgroundColor: c.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
}
