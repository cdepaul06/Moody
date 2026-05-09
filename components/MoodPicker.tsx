import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MOOD_CONFIG } from '@/types';
import { useColors, ColorScheme } from '@/hooks/useColors';

type Props = {
  value: number;
  onChange: (mood: number) => void;
};

export default function MoodPicker({ value, onChange }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {Object.entries(MOOD_CONFIG).map(([key, config]) => {
        const level = Number(key);
        const selected = value === level;
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.option,
              selected && { backgroundColor: config.color + '22', borderColor: config.color },
            ]}
            onPress={() => onChange(level)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{config.emoji}</Text>
            {selected && (
              <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(_c: ColorScheme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
    option: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      gap: 4,
    },
    emoji: { fontSize: 28 },
    label: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  });
}
