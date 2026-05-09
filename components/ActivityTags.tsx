import { ColorScheme, useColors } from "@/hooks/useColors";
import { ACTIVITIES } from "@/types";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  selected: string[];
  onChange: (activities: string[]) => void;
};

export default function ActivityTags({ selected, onChange }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((a) => a !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <View style={styles.grid}>
      {ACTIVITIES.sort((a, b) => a.label.localeCompare(b.label)).map((act) => {
        const active = selected.includes(act.id);
        return (
          <TouchableOpacity
            key={act.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => toggle(act.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipEmoji}>{act.emoji}</Text>
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
              {act.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(c: ColorScheme) {
  return StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: c.background,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    chipActive: { backgroundColor: c.primaryLight, borderColor: c.primary },
    chipEmoji: { fontSize: 14 },
    chipLabel: { fontSize: 13, color: c.subtext, fontWeight: "500" },
    chipLabelActive: { color: c.primary, fontWeight: "600" },
  });
}
