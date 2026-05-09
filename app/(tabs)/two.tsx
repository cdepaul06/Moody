import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { MoodEntry } from '@/types';
import { useColors, ColorScheme } from '@/hooks/useColors';
import MoodEntryCard from '@/components/MoodEntryCard';

export default function HistoryScreen() {
  const { session } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    }, [session])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.listContent}
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MoodEntryCard entry={item} />}
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
  });
}
