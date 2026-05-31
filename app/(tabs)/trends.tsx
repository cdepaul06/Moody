import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useAuth } from "@/context/auth";
import { ColorScheme, useColors } from "@/hooks/useColors";
import { useActivities } from "@/hooks/useActivities";
import { supabase } from "@/lib/supabase";
import { MOOD_CONFIG, MoodEntry } from "@/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";

type Category = "mood" | "energy" | "both";
type PickingField = "start" | "end" | null;

const PRESETS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

const CATEGORY_OPTIONS: { label: string; value: Category }[] = [
  { label: "Mood", value: "mood" },
  { label: "Energy", value: "energy" },
  { label: "Both", value: "both" },
];

function average(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function endOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDaysInRange(start: Date, end: Date) {
  const days: { date: string; label: string }[] = [];
  const current = startOfDay(start);
  const last = startOfDay(end);
  let idx = 0;
  const totalDays =
    Math.round(
      (last.getTime() - current.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;
  const labelInterval =
    totalDays <= 7 ? 1 : totalDays <= 14 ? 2 : totalDays <= 30 ? 5 : 15;

  while (current <= last) {
    const dateStr = current.toISOString().split("T")[0];
    const isLast = current.getTime() === last.getTime();
    days.push({
      date: dateStr,
      label: idx % labelInterval === 0 || isLast ? dateStr.slice(5) : "",
    });
    current.setDate(current.getDate() + 1);
    idx++;
  }
  return days.reverse();
}

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return startOfDay(d);
}

export default function TrendsScreen() {
  const { session } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const CHART_WIDTH = width - 64;

  const { activities, refresh: refreshActivities } = useActivities();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("both");

  // Date range
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(() => endOfDay(new Date()));
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const [pickingField, setPickingField] = useState<PickingField>(null);

  // Activity filter
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  const fetchEntries = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    const { data } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", session.user.id)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endOfDay(endDate).toISOString())
      .order("created_at", { ascending: true });
    if (data) setEntries(data as MoodEntry[]);
    setLoading(false);
  }, [session, startDate, endDate]);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
      refreshActivities();
    }, [fetchEntries, refreshActivities]),
  );

  useEffect(() => {
    fetchEntries();
  }, [startDate, endDate]);

  // Apply activity filter on top of fetched entries
  const filteredEntries = useMemo(() => {
    if (selectedActivityIds.length === 0) return entries;
    return entries.filter((e) =>
      selectedActivityIds.some((id) => e.activities.includes(id)),
    );
  }, [entries, selectedActivityIds]);

  const days = useMemo(
    () => getDaysInRange(startDate, endDate),
    [startDate, endDate],
  );

  const moodByDay = useMemo(
    () =>
      days.map(({ date, label }) => {
        const dayEntries = filteredEntries.filter((e) =>
          e.created_at.startsWith(date),
        );
        return {
          value:
            dayEntries.length > 0
              ? parseFloat(average(dayEntries.map((e) => e.mood)).toFixed(1))
              : 0,
          label,
          dataPointColor: colors.primary,
        };
      }),
    [days, filteredEntries, colors.primary],
  );

  const energyByDay = useMemo(
    () =>
      days.map(({ date, label }) => {
        const dayEntries = filteredEntries.filter((e) =>
          e.created_at.startsWith(date),
        );
        return {
          value:
            dayEntries.length > 0
              ? parseFloat(average(dayEntries.map((e) => e.energy)).toFixed(1))
              : 0,
          label,
          dataPointColor: "#06B6D4",
        };
      }),
    [days, filteredEntries],
  );

  const activityMoods = useMemo(
    () =>
      activities
        .map((act) => {
          const matched = filteredEntries.filter((e) =>
            e.activities.includes(act.id),
          );
          return {
            label: act.emoji,
            value:
              matched.length > 0
                ? parseFloat(average(matched.map((e) => e.mood)).toFixed(1))
                : 0,
            frontColor:
              selectedActivityIds.includes(act.id) || selectedActivityIds.length === 0
                ? colors.primary
                : colors.border,
            topLabelComponent: () =>
              matched.length > 0 ? (
                <Text style={styles.barLabel}>
                  {average(matched.map((e) => e.mood)).toFixed(1)}
                </Text>
              ) : null,
          };
        })
        .filter((a) => a.value > 0),
    [activities, filteredEntries, colors.primary, colors.border, selectedActivityIds, styles.barLabel],
  );

  const moodByTime = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => {
        const hourEntries = filteredEntries.filter(
          (e) => new Date(e.created_at).getHours() === hour,
        );
        const avg =
          hourEntries.length > 0
            ? average(hourEntries.map((e) => e.mood))
            : 0;
        const label =
          hour === 0
            ? "12am"
            : hour < 12
              ? `${hour}am`
              : hour === 12
                ? "12pm"
                : `${hour - 12}pm`;
        return { hour, avg, count: hourEntries.length, label };
      })
        .filter((d) => d.count > 0)
        .map((d) => ({
          value: parseFloat(d.avg.toFixed(1)),
          label: d.label,
          frontColor: colors.primary,
          topLabelComponent: () => (
            <Text style={styles.barLabel}>{d.avg.toFixed(1)}</Text>
          ),
        })),
    [filteredEntries, colors.primary, styles.barLabel],
  );

  const avgMood = average(filteredEntries.map((e) => e.mood));
  const avgEnergy = average(filteredEntries.map((e) => e.energy));
  const topMoodConfig = MOOD_CONFIG[Math.round(avgMood)];
  const showMood = category === "mood" || category === "both";
  const showEnergy = category === "energy" || category === "both";

  // --- Date modal helpers ---
  function applyPreset(days: number) {
    const s = new Date();
    s.setDate(s.getDate() - days);
    setTempStart(startOfDay(s));
    setTempEnd(endOfDay(new Date()));
  }

  function confirmDateRange() {
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setShowDateModal(false);
    setPickingField(null);
  }

  function openDateModal() {
    setTempStart(startDate);
    setTempEnd(endDate);
    setPickingField(null);
    setShowDateModal(true);
  }

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") {
      const field = pickingField;
      setPickingField(null);
      if (event.type === "set" && date && field) {
        if (field === "start") setTempStart(startOfDay(date));
        else setTempEnd(endOfDay(date));
      }
    } else {
      if (date) {
        if (pickingField === "start") setTempStart(startOfDay(date));
        else if (pickingField === "end") setTempEnd(endOfDay(date));
      }
    }
  }

  function toggleActivity(id: string) {
    setSelectedActivityIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  return (
    <>
      {/* Android date picker rendered outside modal */}
      {pickingField !== null && Platform.OS === "android" && (
        <DateTimePicker
          value={pickingField === "start" ? tempStart : tempEnd}
          mode='date'
          display='default'
          onChange={handleDateChange}
          maximumDate={pickingField === "start" ? tempEnd : new Date()}
          minimumDate={pickingField === "end" ? tempStart : undefined}
        />
      )}

      {/* Date range modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowDateModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDateModal(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Date Range</Text>

            {/* Presets */}
            <View style={styles.presetRow}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.days}
                  style={styles.presetPill}
                  onPress={() => applyPreset(p.days)}
                >
                  <Text style={styles.presetPillText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* From / To rows */}
            <TouchableOpacity
              style={[
                styles.dateRow,
                pickingField === "start" && styles.dateRowActive,
              ]}
              onPress={() =>
                setPickingField((f) => (f === "start" ? null : "start"))
              }
            >
              <Text style={styles.dateRowLabel}>From</Text>
              <Text style={styles.dateRowValue}>{formatDate(tempStart)}</Text>
            </TouchableOpacity>

            {pickingField === "start" && Platform.OS === "ios" && (
              <DateTimePicker
                value={tempStart}
                mode='date'
                display='spinner'
                onChange={handleDateChange}
                maximumDate={tempEnd}
                style={styles.iosPicker}
              />
            )}

            <TouchableOpacity
              style={[
                styles.dateRow,
                pickingField === "end" && styles.dateRowActive,
              ]}
              onPress={() =>
                setPickingField((f) => (f === "end" ? null : "end"))
              }
            >
              <Text style={styles.dateRowLabel}>To</Text>
              <Text style={styles.dateRowValue}>{formatDate(tempEnd)}</Text>
            </TouchableOpacity>

            {pickingField === "end" && Platform.OS === "ios" && (
              <DateTimePicker
                value={tempEnd}
                mode='date'
                display='spinner'
                onChange={handleDateChange}
                minimumDate={tempStart}
                maximumDate={new Date()}
                style={styles.iosPicker}
              />
            )}

            <TouchableOpacity
              style={styles.applyButton}
              onPress={confirmDateRange}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Date range bar */}
        <TouchableOpacity style={styles.dateBar} onPress={openDateModal}>
          <Text style={styles.dateBarText}>
            {formatDate(startDate)} – {formatDate(endDate)}
          </Text>
          <Text style={styles.dateBarIcon}>✏️</Text>
        </TouchableOpacity>

        {/* Category filter */}
        <View style={styles.pillGroup}>
          {CATEGORY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.pill, category === opt.value && styles.pillActive]}
              onPress={() => setCategory(opt.value)}
            >
              <Text
                style={[
                  styles.pillText,
                  category === opt.value && styles.pillTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activityFilterRow}
        >
          <TouchableOpacity
            style={[
              styles.activityPill,
              selectedActivityIds.length === 0 && styles.activityPillActive,
            ]}
            onPress={() => setSelectedActivityIds([])}
          >
            <Text
              style={[
                styles.activityPillText,
                selectedActivityIds.length === 0 &&
                  styles.activityPillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {activities.map((act) => {
            const active = selectedActivityIds.includes(act.id);
            return (
              <TouchableOpacity
                key={act.id}
                style={[styles.activityPill, active && styles.activityPillActive]}
                onPress={() => toggleActivity(act.id)}
              >
                <Text style={styles.activityPillEmoji}>{act.emoji}</Text>
                <Text
                  style={[
                    styles.activityPillText,
                    active && styles.activityPillTextActive,
                  ]}
                >
                  {act.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size='large' color={colors.primary} />
          </View>
        ) : filteredEntries.length < 2 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyTitle}>Not enough data</Text>
            <Text style={styles.emptySubtitle}>
              {selectedActivityIds.length > 0
                ? "Try selecting fewer activities or a wider date range."
                : "Log at least 2 entries to see trends."}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              {showMood && (
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>
                    {topMoodConfig?.emoji ?? "😐"}
                  </Text>
                  <Text style={styles.statValue}>{avgMood.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Avg Mood</Text>
                </View>
              )}
              {showEnergy && (
                <View style={styles.statCard}>
                  <Text style={styles.statEmoji}>⚡</Text>
                  <Text style={styles.statValue}>{avgEnergy.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Avg Energy</Text>
                </View>
              )}
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>📝</Text>
                <Text style={styles.statValue}>{filteredEntries.length}</Text>
                <Text style={styles.statLabel}>Entries</Text>
              </View>
            </View>

            {showMood && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Mood Trend</Text>
                <LineChart
                  data={moodByDay}
                  width={CHART_WIDTH}
                  height={160}
                  color={colors.primary}
                  thickness={2}
                  dataPointsColor={colors.primary}
                  dataPointsRadius={4}
                  maxValue={5}
                  noOfSections={5}
                  yAxisLabelTexts={["", "1", "2", "3", "4", "5"]}
                  yAxisTextStyle={styles.axisText}
                  xAxisLabelTextStyle={styles.axisText}
                  rulesColor={colors.border}
                  areaChart
                  startFillColor={colors.primaryLight}
                  endFillColor={colors.card}
                  startOpacity={0.6}
                  endOpacity={0.1}
                  isAnimated
                  showVerticalLines
                  verticalLinesColor={colors.border}
                />
              </View>
            )}

            {showEnergy && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Energy Trend</Text>
                <LineChart
                  data={energyByDay}
                  width={CHART_WIDTH}
                  height={160}
                  color='#06B6D4'
                  thickness={2}
                  dataPointsColor='#06B6D4'
                  dataPointsRadius={4}
                  maxValue={10}
                  noOfSections={5}
                  yAxisLabelTexts={["", "2", "4", "6", "8", "10"]}
                  yAxisTextStyle={styles.axisText}
                  xAxisLabelTextStyle={styles.axisText}
                  rulesColor={colors.border}
                  areaChart
                  startFillColor='#CFFAFE'
                  endFillColor={colors.card}
                  startOpacity={0.6}
                  endOpacity={0.1}
                  isAnimated
                  showVerticalLines
                  verticalLinesColor={colors.border}
                />
              </View>
            )}

            {showMood && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Mood by Time of Day</Text>
                <BarChart
                  data={moodByTime}
                  width={CHART_WIDTH}
                  height={160}
                  barWidth={40}
                  spacing={16}
                  maxValue={5}
                  noOfSections={5}
                  yAxisTextStyle={styles.axisText}
                  xAxisLabelTextStyle={styles.axisText}
                  rulesColor={colors.border}
                  isAnimated
                  roundedTop
                />
              </View>
            )}

            {showMood && activityMoods.length > 0 && (
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
                  rulesColor={colors.border}
                  isAnimated
                  roundedTop
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 40, gap: 12 },

    // Date bar
    dateBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    dateBarText: { fontSize: 15, fontWeight: "600", color: c.text },
    dateBarIcon: { fontSize: 16 },

    // Category pills
    pillGroup: { flexDirection: "row", gap: 6 },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    pillActive: { backgroundColor: c.primary, borderColor: c.primary },
    pillText: { fontSize: 13, fontWeight: "500", color: c.subtext },
    pillTextActive: { color: "#fff" },

    // Activity filter
    activityFilterRow: { flexDirection: "row", gap: 6, paddingVertical: 2 },
    activityPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    activityPillActive: { backgroundColor: c.primary, borderColor: c.primary },
    activityPillEmoji: { fontSize: 13 },
    activityPillText: { fontSize: 12, fontWeight: "500", color: c.subtext },
    activityPillTextActive: { color: "#fff" },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      gap: 16,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: "center",
      marginBottom: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: c.text,
      textAlign: "center",
    },
    presetRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
    presetPill: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    presetPillText: { fontSize: 13, fontWeight: "600", color: c.text },
    dateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    dateRowActive: { borderColor: c.primary },
    dateRowLabel: { fontSize: 14, color: c.subtext, fontWeight: "500" },
    dateRowValue: { fontSize: 15, color: c.text, fontWeight: "600" },
    iosPicker: { height: 180 },
    applyButton: {
      backgroundColor: c.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 4,
    },
    applyButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

    // Content
    loadingBox: {
      height: 200,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyBox: {
      height: 260,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: c.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 15,
      color: c.subtext,
      textAlign: "center",
      lineHeight: 22,
    },
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    statEmoji: { fontSize: 28, marginBottom: 4 },
    statValue: { fontSize: 22, fontWeight: "700", color: c.text },
    statLabel: {
      fontSize: 11,
      color: c.subtext,
      marginTop: 2,
      fontWeight: "500",
    },
    chartCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    chartTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: c.text,
      marginBottom: 16,
    },
    axisText: { fontSize: 10, color: c.subtext },
    barLabel: { fontSize: 9, color: c.subtext, marginBottom: 2 },
  });
}
