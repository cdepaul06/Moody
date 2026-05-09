import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ACTIVITIES, COLORS } from '@/types';

type Props = {
  selected: string[];
  onChange: (activities: string[]) => void;
};

export default function ActivityTags({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((a) => a !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <View style={styles.grid}>
      {ACTIVITIES.map((act) => {
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

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, color: COLORS.subtext, fontWeight: '500' },
  chipLabelActive: { color: COLORS.primary, fontWeight: '600' },
});
