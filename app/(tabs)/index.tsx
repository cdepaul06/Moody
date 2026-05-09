import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/types';
import MoodPicker from '@/components/MoodPicker';
import EnergySlider from '@/components/EnergySlider';
import ActivityTags from '@/components/ActivityTags';

export default function LogMoodScreen() {
  const { session, signOut } = useAuth();
  const [mood, setMood] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(5);
  const [activities, setActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleLog = async () => {
    if (!session?.user) return;

    setLoading(true);
    const { error } = await supabase.from('mood_entries').insert({
      user_id: session.user.id,
      mood,
      energy,
      activities,
      notes: notes.trim(),
    });

    if (error) {
      Alert.alert('Could not save entry', error.message);
    } else {
      setSaved(true);
      setMood(3);
      setEnergy(5);
      setActivities([]);
      setNotes('');
      setTimeout(() => setSaved(false), 2500);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mood</Text>
          <MoodPicker value={mood} onChange={setMood} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Energy Level</Text>
          <EnergySlider value={energy} onChange={setEnergy} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Activities</Text>
          <ActivityTags selected={activities} onChange={setActivities} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            style={styles.notes}
            placeholder="How are you feeling? What's on your mind?"
            placeholderTextColor={COLORS.subtext}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {saved && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Entry saved!</Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleLog} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log Entry</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40, gap: 8 },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  notes: {
    fontSize: 15,
    color: COLORS.text,
    minHeight: 90,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successText: { color: '#16A34A', fontSize: 15, fontWeight: '600' },
  signOutButton: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  signOutText: { color: COLORS.subtext, fontSize: 14 },
});
