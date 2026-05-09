import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ACTIVITIES, MOOD_CONFIG, MoodEntry } from '@/types';
import { Activity } from '@/hooks/useActivities';
import { useColors, ColorScheme } from '@/hooks/useColors';

type Props = {
  entry: MoodEntry;
  activities?: Activity[];
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function energyLabel(value: number): string {
  if (value <= 2) return 'Exhausted';
  if (value <= 4) return 'Low';
  if (value <= 6) return 'Moderate';
  if (value <= 8) return 'High';
  return 'Energized';
}

export default function MoodEntryCard({ entry, activities }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const allActivities = activities ?? ACTIVITIES.map((a) => ({ ...a, custom: false }));
  const moodConfig = MOOD_CONFIG[entry.mood];
  const activityLabels = entry.activities
    .map((id) => allActivities.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => `${a!.emoji} ${a!.label}`);

  return (
    <View style={[styles.card, { borderLeftColor: moodConfig.color }]}>
      <View style={styles.header}>
        <View style={styles.moodRow}>
          <Text style={styles.emoji}>{moodConfig.emoji}</Text>
          <View>
            <Text style={[styles.moodLabel, { color: moodConfig.color }]}>
              {moodConfig.label}
            </Text>
            <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
          </View>
        </View>
        <View style={styles.energyBadge}>
          <Text style={styles.energyText}>⚡ {entry.energy}/10</Text>
          <Text style={styles.energySubtext}>{energyLabel(entry.energy)}</Text>
        </View>
      </View>

      {activityLabels.length > 0 && (
        <View style={styles.tagsRow}>
          {activityLabels.map((label) => (
            <View key={label} style={styles.tag}>
              <Text style={styles.tagText}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {entry.notes ? (
        <Text style={styles.notes} numberOfLines={3}>
          {entry.notes}
        </Text>
      ) : null}
    </View>
  );
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 4,
      gap: 10,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    moodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    emoji: { fontSize: 32 },
    moodLabel: { fontSize: 15, fontWeight: '700' },
    date: { fontSize: 12, color: c.subtext, marginTop: 1 },
    energyBadge: { alignItems: 'flex-end' },
    energyText: { fontSize: 13, fontWeight: '600', color: c.text },
    energySubtext: { fontSize: 11, color: c.subtext, marginTop: 1 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: {
      backgroundColor: c.primaryLight,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    tagText: { fontSize: 12, color: c.primary, fontWeight: '500' },
    notes: { fontSize: 14, color: c.subtext, lineHeight: 20, fontStyle: 'italic' },
  });
}
