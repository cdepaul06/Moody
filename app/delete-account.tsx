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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { useColors, ColorScheme } from '@/hooks/useColors';

export default function DeleteAccountScreen() {
  const { session, signOut } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password) { Alert.alert('Enter your password to confirm.'); return; }

    Alert.alert(
      'Delete account permanently?',
      'All your mood entries and data will be erased. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error: authError } = await supabase.auth.signInWithPassword({
              email: session?.user?.email ?? '',
              password,
            });
            if (authError) {
              Alert.alert('Incorrect password', 'Please check your password and try again.');
              setLoading(false);
              return;
            }
            const { error } = await supabase.functions.invoke('delete-user');
            if (error) {
              Alert.alert('Could not delete account', error.message);
              setLoading(false);
              return;
            }
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.warningCard}>
          <FontAwesome name="exclamation-triangle" size={28} color={colors.danger} />
          <Text style={styles.warningTitle}>This is permanent</Text>
          <Text style={styles.warningBody}>
            Deleting your account will immediately and permanently erase all your mood entries,
            energy logs, and account data. There is no way to recover this information.
          </Text>
        </View>

        <Text style={styles.label}>Confirm with your password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.subtext}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteButtonText}>Delete My Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 20, gap: 12 },
    warningCard: {
      backgroundColor: c.danger + '18',
      borderRadius: 16, padding: 20, alignItems: 'center', gap: 10,
      borderWidth: 1, borderColor: c.danger + '44', marginBottom: 8,
    },
    warningTitle: { fontSize: 17, fontWeight: '700', color: c.danger },
    warningBody: { fontSize: 14, color: c.text, textAlign: 'center', lineHeight: 21 },
    label: {
      fontSize: 13, fontWeight: '600', color: c.subtext,
      textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8, marginBottom: 6,
    },
    input: {
      backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 15, color: c.text, borderWidth: 1, borderColor: c.border,
    },
    deleteButton: { backgroundColor: c.danger, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
}
