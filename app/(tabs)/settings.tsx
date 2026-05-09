import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { useColors, ColorScheme } from '@/hooks/useColors';
import { useTheme, ThemePreference } from '@/context/theme';

function SectionHeader({ title, styles }: { title: string; styles: ReturnType<typeof makeStyles> }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingsRow({
  label, onPress, danger = false, styles, colors,
}: {
  label: string; onPress: () => void; danger?: boolean;
  styles: ReturnType<typeof makeStyles>; colors: ColorScheme;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <Text style={[styles.rowLabel, danger && styles.dangerLabel]}>{label}</Text>
      <FontAwesome name="chevron-right" size={13} color={danger ? colors.danger : colors.subtext} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { preference, setPreference } = useTheme();

  const themeOptions: { label: string; value: ThemePreference }[] = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  const user = session?.user;
  const initialName: string = user?.user_metadata?.display_name ?? '';
  const email = user?.email ?? '';

  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(initialName);
  const [nameInput, setNameInput] = useState(initialName);
  const [savingName, setSavingName] = useState(false);

  const avatarLetter = (displayName || email).charAt(0).toUpperCase();

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { display_name: trimmed } });
    if (error) {
      Alert.alert('Could not update name', error.message);
    } else {
      setDisplayName(trimmed);
      setEditingName(false);
    }
    setSavingName(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>

        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              placeholderTextColor={colors.subtext}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity style={styles.saveNameButton} onPress={handleSaveName} disabled={savingName}>
              {savingName ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveNameText}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelNameButton} onPress={() => { setNameInput(displayName); setEditingName(false); }}>
              <Text style={styles.cancelNameText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nameRow} onPress={() => setEditingName(true)}>
            <Text style={styles.displayName}>{displayName || 'Add your name'}</Text>
            <FontAwesome name="pencil" size={13} color={colors.subtext} style={styles.pencil} />
          </TouchableOpacity>
        )}

        <Text style={styles.emailText}>{email}</Text>
      </View>

      <SectionHeader title="ACCOUNT" styles={styles} />
      <View style={styles.card}>
        <SettingsRow label="Change Email" onPress={() => router.push('/change-email')} styles={styles} colors={colors} />
        <View style={styles.divider} />
        <SettingsRow label="Change Password" onPress={() => router.push('/change-password')} styles={styles} colors={colors} />
      </View>

      <SectionHeader title="APPEARANCE" styles={styles} />
      <View style={styles.card}>
        <View style={styles.themeRow}>
          {themeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.themeButton, preference === opt.value && styles.themeButtonActive]}
              onPress={() => setPreference(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeButtonText, preference === opt.value && styles.themeButtonTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionHeader title="DANGER ZONE" styles={styles} />
      <View style={styles.card}>
        <SettingsRow label="Delete Account" onPress={() => router.push('/delete-account')} danger styles={styles} colors={colors} />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 48 },
    profileCard: {
      backgroundColor: c.card, borderRadius: 16, padding: 20,
      alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: c.border, gap: 8,
    },
    avatar: {
      width: 72, height: 72, borderRadius: 36, backgroundColor: c.primaryLight,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    avatarLetter: { fontSize: 30, fontWeight: '700', color: c.primary },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    displayName: { fontSize: 20, fontWeight: '600', color: c.text },
    pencil: { marginTop: 2 },
    nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
    nameInput: {
      flex: 1, backgroundColor: c.background, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8, fontSize: 15,
      color: c.text, borderWidth: 1, borderColor: c.border,
    },
    saveNameButton: {
      backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 14,
      paddingVertical: 8, minWidth: 52, alignItems: 'center',
    },
    saveNameText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    cancelNameButton: { paddingHorizontal: 4 },
    cancelNameText: { color: c.subtext, fontSize: 14 },
    emailText: { fontSize: 14, color: c.subtext },
    sectionHeader: {
      fontSize: 11, fontWeight: '600', color: c.subtext,
      letterSpacing: 0.8, marginBottom: 6, marginLeft: 4,
    },
    card: {
      backgroundColor: c.card, borderRadius: 16, borderWidth: 1,
      borderColor: c.border, marginBottom: 24, overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15 },
    rowLabel: { fontSize: 15, color: c.text },
    dangerLabel: { color: c.danger },
    divider: { height: 1, backgroundColor: c.border, marginLeft: 16 },
    themeRow: {
      flexDirection: 'row',
      padding: 8,
      gap: 6,
    },
    themeButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    themeButtonActive: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    themeButtonText: { fontSize: 14, fontWeight: '500', color: c.subtext },
    themeButtonTextActive: { color: c.primary, fontWeight: '600' },
    signOutButton: {
      alignItems: 'center', paddingVertical: 14, borderRadius: 14,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.card,
    },
    signOutText: { fontSize: 15, color: c.subtext, fontWeight: '500' },
  });
}
