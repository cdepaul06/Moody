import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { ACTIVITIES, COLORS, MOOD_CONFIG, MoodEntry } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64;

function average(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function getLast14Days() {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function TrendsScreen() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchEntries = async () => {
        if (!session?.user) return;
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const { data } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: true });

        if (data) setEntries(data as MoodEntry[]);
        setLoading(false);
      };
      fetchEntries();
    }, [session])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (entries.length < 2) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>📈</Text>
        <Text style={styles.emptyTitle}>Not enough data yet</Text>
        <Text style={styles.emptySubtitle}>
          Log at least 2 entries to see your trends.
        </Text>
      </View>
    );
  }

  // Mood over last 14 days (daily average)
  const days = getLast14Days();
  const moodByDay = days.map((day) => {
    const dayEntries = entries.filter((e) => e.created_at.startsWith(day));
    return {
      value: dayEntries.length > 0 ? average(dayEntries.map((e) => e.mood)) : 0,
      label: day.slice(5), // MM-DD
      dataPointColor: COLORS.primary,
    };
  });

  // Energy over last 14 days
  const energyByDay = days.map((day) => {
    const dayEntries = entries.filter((e) => e.created_at.startsWith(day));
    return {
      value: dayEntries.length > 0 ? parseFloat(average(dayEntries.map((e) => e.energy)).toFixed(1)) : 0,
      label: day.slice(5),
      dataPointColor: '#06B6D4',
    };
  });

  // Average mood by activity
  const activityMoods = ACTIVITIES.map((act) => {
    const matched = entries.filter((e) => e.activities.includes(act.id));
    return {
      label: act.emoji,
      value: matched.length > 0 ? parseFloat(average(matched.map((e) => e.mood)).toFixed(1)) : 0,
      frontColor: COLORS.primary,
      topLabelComponent: () =>
        matched.length > 0 ? (
          <Text style={styles.barLabel}>{average(matched.map((e) => e.mood)).toFixed(1)}</Text>
        ) : null,
    };
  }).filter((a) => a.value > 0);

  // Summary stats
  const totalEntries = entries.length;
  const avgMood = average(entries.map((e) => e.mood));
  const avgEnergy = average(entries.map((e) => e.energy));
  const topMoodConfig = MOOD_CONFIG[Math.round(avgMood)];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>{topMoodConfig?.emoji ?? '😐'}</Text>
          <Text style={styles.statValue}>{avgMood.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Mood</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={styles.statValue}>{avgEnergy.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Energy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📝</Text>
          <Text style={styles.statValue}>{totalEntries}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
      </View>

      {/* Mood trend chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Mood — Last 14 Days</Text>
        <LineChart
          data={moodByDay}
          width={CHART_WIDTH}
          height={160}
          color={COLORS.primary}
          thickness={2}
          dataPointsColor={COLORS.primary}
          dataPointsRadius={4}
          maxValue={5}
          noOfSections={5}
          yAxisLabelTexts={['', '1', '2', '3', '4', '5']}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          hideRules={false}
          rulesColor={COLORS.border}
          areaChart
          startFillColor={COLORS.primaryLight}
          endFillColor="#fff"
          startOpacity={0.6}
          endOpacity={0.1}
          isAnimated
          hideDataPoints={false}
          showVerticalLines
          verticalLinesColor={COLORS.border}
        />
      </View>

      {/* Energy trend chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Energy — Last 14 Days</Text>
        <LineChart
          data={energyByDay}
          width={CHART_WIDTH}
          height={160}
          color="#06B6D4"
          thickness={2}
          dataPointsColor="#06B6D4"
          dataPointsRadius={4}
          maxValue={10}
          noOfSections={5}
          yAxisLabelTexts={['', '2', '4', '6', '8', '10']}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          hideRules={false}
          rulesColor={COLORS.border}
          areaChart
          startFillColor="#CFFAFE"
          endFillColor="#fff"
          startOpacity={0.6}
          endOpacity={0.1}
          isAnimated
          showVerticalLines
          verticalLinesColor={COLORS.border}
        />
      </View>

      {/* Mood by activity */}
      {activityMoods.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Avg Mood by Activity</Text>
          <BarChart
            data={activityMoods}
            width={CHART_WIDTH}
            height={160}
            barWidth={28}
            spacing={8}
            maxValue={5}
            noOfSections={5}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            rulesColor={COLORS.border}
            isAnimated
            roundedTop
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 40,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: COLORS.subtext, textAlign: 'center', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statEmoji: { fontSize: 28, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.subtext, marginTop: 2, fontWeight: '500' },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  axisText: { fontSize: 10, color: COLORS.subtext },
  barLabel: { fontSize: 9, color: COLORS.subtext, marginBottom: 2 },
});
