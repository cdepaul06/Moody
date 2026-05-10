import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { MoodEntry } from '@/types';
import { useColors, ColorScheme } from '@/hooks/useColors';
import { useActivities } from '@/hooks/useActivities';
import MoodEntryCard from '@/components/MoodEntryCard';
import MoodPicker from '@/components/MoodPicker';
import EnergySlider from '@/components/EnergySlider';
import ActivityTags from '@/components/ActivityTags';

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function formatDayChip(date: Date, index: number) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatEntryDate(date: Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (dayStart.getTime() === today.getTime()) return `Today at ${timeStr}`;
  if (dayStart.getTime() === yesterday.getTime()) return `Yesterday at ${timeStr}`;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
}

function toPickerHour(h: number) { return h === 0 ? 12 : h > 12 ? h - 12 : h; }
function toHour24(h: number, isPM: boolean) { return isPM ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h); }

export default function HistoryScreen() {
  const { session } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { activities, refresh: refreshActivities } = useActivities();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [editMood, setEditMood] = useState(3);
  const [editEnergy, setEditEnergy] = useState(5);
  const [editActivities, setEditActivities] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pickerDay, setPickerDay] = useState(new Date());
  const [pickerHour, setPickerHour] = useState(12);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerIsPM, setPickerIsPM] = useState(false);

  const fetchEntries = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) setEntries(data as MoodEntry[]);
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEntries();
      refreshActivities();
    }, [session])
  );

  const openEdit = (entry: MoodEntry) => {
    setEditingEntry(entry);
    setEditMood(entry.mood);
    setEditEnergy(entry.energy);
    setEditActivities(entry.activities);
    setEditNotes(entry.notes);
    setEditDate(new Date(entry.created_at));
  };

  const openDatePicker = () => {
    const h = editDate.getHours();
    const day = new Date(editDate); day.setHours(0, 0, 0, 0);
    setPickerDay(day);
    setPickerHour(toPickerHour(h));
    setPickerMinute(Math.round(editDate.getMinutes() / 5) * 5 % 60);
    setPickerIsPM(h >= 12);
    setDatePickerOpen(true);
  };

  const confirmDatePicker = () => {
    const result = new Date(pickerDay);
    result.setHours(toHour24(pickerHour, pickerIsPM), pickerMinute, 0, 0);
    setEditDate(result);
    setDatePickerOpen(false);
  };

  const adjustHour = (delta: number) =>
    setPickerHour((h) => { const n = h + delta; return n > 12 ? 1 : n < 1 ? 12 : n; });

  const adjustMinute = (delta: number) =>
    setPickerMinute((m) => { const n = m + delta * 5; return n >= 60 ? 0 : n < 0 ? 55 : n; });

  const handleSave = async () => {
    if (!editingEntry) return;
    if (editNotes.trim().length > 2000) {
      Alert.alert('Notes too long', 'Please keep your notes under 2000 characters.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('mood_entries')
      .update({
        mood: editMood,
        energy: editEnergy,
        activities: editActivities,
        notes: editNotes.trim(),
        created_at: editDate.toISOString(),
      })
      .eq('id', editingEntry.id);
    if (error) {
      Alert.alert('Could not save', error.message);
    } else {
      setEntries((prev) =>
        prev
          .map((e) =>
            e.id === editingEntry.id
              ? { ...e, mood: editMood, energy: editEnergy, activities: editActivities, notes: editNotes.trim(), created_at: editDate.toISOString() }
              : e
          )
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
      setEditingEntry(null);
    }
    setSaving(false);
  };

  const handleDelete = () => {
    if (!editingEntry) return;
    Alert.alert('Delete Entry', 'Are you sure you want to permanently delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('mood_entries').delete().eq('id', editingEntry.id);
          setEntries((prev) => prev.filter((e) => e.id !== editingEntry.id));
          setEditingEntry(null);
        },
      },
    ]);
  };

  const last7Days = getLast7Days();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.container}
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.listContent}
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MoodEntryCard
            entry={item}
            activities={activities}
            onPress={() => openEdit(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchEntries(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>
              Log your first mood from the{' '}
              <Text style={styles.emptyHighlight}>Log Mood</Text> tab.
            </Text>
          </View>
        }
      />

      {/* Edit entry modal */}
      <Modal
        visible={editingEntry !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingEntry(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalFlex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingEntry(null)} hitSlop={8}>
              <FontAwesome name="times" size={18} color={colors.subtext} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Entry</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={8}>
              {saving
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mood</Text>
              <MoodPicker value={editMood} onChange={setEditMood} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Energy Level</Text>
              <EnergySlider value={editEnergy} onChange={setEditEnergy} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Activities</Text>
              <ActivityTags
                selected={editActivities}
                onChange={setEditActivities}
                activities={activities}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="How were you feeling?"
                placeholderTextColor={colors.subtext}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={2000}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date & Time</Text>
              <TouchableOpacity style={styles.dateRow} onPress={openDatePicker}>
                <FontAwesome name="calendar" size={14} color={colors.primary} />
                <Text style={styles.dateText}>{formatEntryDate(editDate)}</Text>
                <FontAwesome name="pencil" size={12} color={colors.subtext} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <FontAwesome name="trash" size={14} color={colors.danger} />
              <Text style={styles.deleteText}>Delete Entry</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date picker modal */}
      <Modal
        visible={datePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>When?</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={styles.dayScrollContent}>
              {last7Days.map((day, i) => {
                const selected = pickerDay.getTime() === day.getTime();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dayChip, selected && styles.dayChipSelected]}
                    onPress={() => setPickerDay(day)}
                  >
                    <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                      {formatDayChip(day, i)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.timeRow}>
              <View style={styles.timeStepper}>
                <TouchableOpacity onPress={() => adjustHour(1)} style={styles.stepBtn} hitSlop={8}>
                  <FontAwesome name="chevron-up" size={13} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.timeValue}>{String(pickerHour).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => adjustHour(-1)} style={styles.stepBtn} hitSlop={8}>
                  <FontAwesome name="chevron-down" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.timeSep}>:</Text>

              <View style={styles.timeStepper}>
                <TouchableOpacity onPress={() => adjustMinute(1)} style={styles.stepBtn} hitSlop={8}>
                  <FontAwesome name="chevron-up" size={13} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.timeValue}>{String(pickerMinute).padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => adjustMinute(-1)} style={styles.stepBtn} hitSlop={8}>
                  <FontAwesome name="chevron-down" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.ampmGroup}>
                <TouchableOpacity
                  style={[styles.ampmBtn, !pickerIsPM && styles.ampmBtnActive]}
                  onPress={() => setPickerIsPM(false)}
                >
                  <Text style={[styles.ampmText, !pickerIsPM && styles.ampmTextActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ampmBtn, pickerIsPM && styles.ampmBtnActive]}
                  onPress={() => setPickerIsPM(true)}
                >
                  <Text style={[styles.ampmText, pickerIsPM && styles.ampmTextActive]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.pickerActions}>
              <TouchableOpacity style={styles.pickerCancel} onPress={() => setDatePickerOpen(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerConfirm} onPress={confirmDatePicker}>
                <Text style={styles.pickerConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    listContent: { padding: 16, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    emptyContainer: { flex: 1 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '600', color: c.text, marginBottom: 8 },
    emptySubtitle: { fontSize: 15, color: c.subtext, textAlign: 'center', lineHeight: 22 },
    emptyHighlight: { color: c.primary, fontWeight: '600' },
    modalFlex: { flex: 1, backgroundColor: c.background },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.background,
    },
    modalTitle: { fontSize: 17, fontWeight: '600', color: c.text },
    saveText: { fontSize: 16, fontWeight: '600', color: c.primary },
    modalScroll: { flex: 1 },
    modalContent: { padding: 16, paddingBottom: 40, gap: 8 },
    section: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: c.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    notesInput: { fontSize: 15, color: c.text, minHeight: 90, lineHeight: 22 },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dateText: { flex: 1, fontSize: 15, color: c.text, fontWeight: '500' },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.danger,
    },
    deleteText: { fontSize: 15, fontWeight: '600', color: c.danger },
    pickerBackdrop: {
      flex: 1, backgroundColor: '#00000066',
      justifyContent: 'center', alignItems: 'center', padding: 32,
    },
    pickerCard: {
      width: '100%', backgroundColor: c.card, borderRadius: 20,
      borderWidth: 1, borderColor: c.border, padding: 24, gap: 4,
    },
    pickerTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 8 },
    dayScroll: { marginBottom: 20 },
    dayScrollContent: { gap: 8, paddingVertical: 4 },
    dayChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.background,
    },
    dayChipSelected: { backgroundColor: c.primaryLight, borderColor: c.primary },
    dayChipText: { fontSize: 13, color: c.subtext, fontWeight: '500' },
    dayChipTextSelected: { color: c.primary, fontWeight: '600' },
    timeRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 12, marginBottom: 20,
    },
    timeStepper: { alignItems: 'center', gap: 8 },
    stepBtn: { padding: 4 },
    timeValue: { fontSize: 32, fontWeight: '600', color: c.text, minWidth: 48, textAlign: 'center' },
    timeSep: { fontSize: 28, fontWeight: '600', color: c.text, marginTop: -8 },
    ampmGroup: { gap: 6, marginLeft: 8 },
    ampmBtn: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.background,
    },
    ampmBtnActive: { backgroundColor: c.primaryLight, borderColor: c.primary },
    ampmText: { fontSize: 13, fontWeight: '600', color: c.subtext },
    ampmTextActive: { color: c.primary },
    pickerActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    pickerCancel: {
      flex: 1, paddingVertical: 13, borderRadius: 12,
      borderWidth: 1, borderColor: c.border, alignItems: 'center',
    },
    pickerCancelText: { fontSize: 15, color: c.subtext, fontWeight: '500' },
    pickerConfirm: {
      flex: 1, paddingVertical: 13, borderRadius: 12,
      backgroundColor: c.primary, alignItems: 'center',
    },
    pickerConfirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  });
}
