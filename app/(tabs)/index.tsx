import { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import EmojiPicker from 'rn-emoji-keyboard';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { useColors, ColorScheme } from '@/hooks/useColors';
import { useActivities } from '@/hooks/useActivities';
import MoodPicker from '@/components/MoodPicker';
import EnergySlider from '@/components/EnergySlider';
import ActivityTags from '@/components/ActivityTags';

export default function LogMoodScreen() {
  const { session } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { activities: allActivities, refresh, addActivity, deleteActivity } = useActivities();
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const scrollRef = useRef<ScrollView>(null);

  const [mood, setMood] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(5);
  const [activities, setActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [addingActivity, setAddingActivity] = useState(false);
  const [newEmoji, setNewEmoji] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteSelections, setDeleteSelections] = useState<Set<string>>(new Set());

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

  const handleAddActivity = async () => {
    if (!newEmoji.trim()) { Alert.alert('Missing emoji', 'Please enter an emoji.'); return; }
    if (!newLabel.trim()) { Alert.alert('Missing name', 'Please enter an activity name.'); return; }
    setSavingActivity(true);
    const error = await addActivity(newLabel, newEmoji);
    if (error) {
      Alert.alert('Could not add activity', error);
    } else {
      setNewEmoji('');
      setNewLabel('');
      setAddingActivity(false);
    }
    setSavingActivity(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollRef}
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
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Activities</Text>
            <View style={styles.headerActions}>
              {(() => {
                const selectedCustom = allActivities.filter((a) => a.custom && activities.includes(a.id));
                if (selectedCustom.length > 0 && !addingActivity) {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        setDeleteSelections(new Set(selectedCustom.map((a) => a.id)));
                        setDeleteModalVisible(true);
                      }}
                      hitSlop={8}
                      style={styles.deleteButton}
                    >
                      <FontAwesome name="trash" size={11} color={colors.danger} />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  );
                }
                return null;
              })()}
              {addingActivity ? (
                <TouchableOpacity onPress={() => { setAddingActivity(false); setNewEmoji(''); setNewLabel(''); }} hitSlop={8}>
                  <FontAwesome name="times" size={16} color={colors.subtext} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setAddingActivity(true)} hitSlop={8} style={styles.addButton}>
                  <FontAwesome name="plus" size={11} color={colors.primary} />
                  <Text style={styles.addButtonText}>New</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {addingActivity && (
            <View style={styles.addForm}>
              <TouchableOpacity style={styles.emojiButton} onPress={() => setEmojiPickerOpen(true)}>
                <Text style={styles.emojiButtonText}>{newEmoji || '😊'}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.labelInput}
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="Activity name"
                placeholderTextColor={colors.subtext}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddActivity}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleAddActivity} disabled={savingActivity}>
                {savingActivity
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.saveButtonText}>Add</Text>}
              </TouchableOpacity>
            </View>
          )}

          <EmojiPicker
            onEmojiSelected={(e) => { setNewEmoji(e.emoji); setEmojiPickerOpen(false); }}
            open={emojiPickerOpen}
            onClose={() => setEmojiPickerOpen(false)}
            theme={{
              backdrop: '#00000066',
              knob: colors.border,
              container: colors.card,
              header: colors.text,
              skinTonesContainer: colors.background,
              category: {
                icon: colors.subtext,
                iconActive: colors.primary,
                container: colors.card,
                containerActive: colors.primaryLight,
              },
              search: {
                text: colors.text,
                placeholder: colors.subtext,
                icon: colors.subtext,
                background: colors.background,
              },
              emoji: {
                selected: colors.primaryLight,
              },
            }}
          />

          <ActivityTags selected={activities} onChange={setActivities} activities={allActivities} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            style={styles.notes}
            placeholder="How are you feeling? What's on your mind?"
            placeholderTextColor={colors.subtext}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)}
          />
        </View>

        {saved && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Entry saved!</Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleLog} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log Entry</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Activities</Text>
            <Text style={styles.modalSubtitle}>Select which to permanently remove</Text>
            {allActivities.filter((a) => a.custom && activities.includes(a.id)).map((act) => {
              const checked = deleteSelections.has(act.id);
              return (
                <TouchableOpacity
                  key={act.id}
                  style={styles.modalRow}
                  onPress={() => setDeleteSelections((prev) => {
                    const next = new Set(prev);
                    checked ? next.delete(act.id) : next.add(act.id);
                    return next;
                  })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalEmoji}>{act.emoji}</Text>
                  <Text style={styles.modalLabel}>{act.label}</Text>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <FontAwesome name="check" size={10} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDelete, deleteSelections.size === 0 && styles.modalDeleteDisabled]}
                disabled={deleteSelections.size === 0}
                onPress={() => {
                  deleteSelections.forEach((id) => {
                    setActivities((prev) => prev.filter((a) => a !== id));
                    deleteActivity(id);
                  });
                  setDeleteModalVisible(false);
                  setDeleteSelections(new Set());
                }}
              >
                <Text style={styles.modalDeleteText}>
                  Delete{deleteSelections.size > 1 ? ` (${deleteSelections.size})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 20, paddingBottom: 40, gap: 8 },
    section: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: c.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deleteButton: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
      borderWidth: 1, borderColor: c.danger,
    },
    deleteButtonText: { fontSize: 12, color: c.danger, fontWeight: '600' },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.primary,
    },
    addButtonText: { fontSize: 12, color: c.primary, fontWeight: '600' },
    addForm: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    emojiButton: {
      width: 44, height: 44, borderRadius: 10, borderWidth: 1.5,
      borderColor: c.primary, backgroundColor: c.background,
      alignItems: 'center', justifyContent: 'center',
    },
    emojiButtonText: { fontSize: 22 },
    labelInput: {
      flex: 1, backgroundColor: c.background, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8, fontSize: 15,
      color: c.text, borderWidth: 1, borderColor: c.border,
    },
    saveButton: {
      backgroundColor: c.primary, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 8, minWidth: 48, alignItems: 'center',
    },
    saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    notes: { fontSize: 15, color: c.text, minHeight: 90, lineHeight: 22 },
    button: {
      backgroundColor: c.primary,
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
    modalBackdrop: {
      flex: 1, backgroundColor: '#00000066',
      justifyContent: 'center', alignItems: 'center', padding: 32,
    },
    modalCard: {
      width: '100%', backgroundColor: c.card, borderRadius: 20,
      borderWidth: 1, borderColor: c.border, padding: 24, gap: 4,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 2 },
    modalSubtitle: { fontSize: 13, color: c.subtext, marginBottom: 12 },
    modalRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border,
    },
    modalEmoji: { fontSize: 20 },
    modalLabel: { flex: 1, fontSize: 15, color: c.text, fontWeight: '500' },
    checkbox: {
      width: 22, height: 22, borderRadius: 6, borderWidth: 2,
      borderColor: c.border, alignItems: 'center', justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: c.danger, borderColor: c.danger },
    modalActions: {
      flexDirection: 'row', gap: 10, marginTop: 16,
    },
    modalCancel: {
      flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1,
      borderColor: c.border, alignItems: 'center',
    },
    modalCancelText: { fontSize: 15, color: c.subtext, fontWeight: '500' },
    modalDelete: {
      flex: 1, paddingVertical: 13, borderRadius: 12,
      backgroundColor: c.danger, alignItems: 'center',
    },
    modalDeleteDisabled: { opacity: 0.4 },
    modalDeleteText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  });
}
