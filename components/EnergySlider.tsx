import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS } from '@/types';

type Props = {
  value: number;
  onChange: (energy: number) => void;
};

function energyColor(value: number): string {
  if (value <= 3) return '#EF4444';
  if (value <= 5) return '#F97316';
  if (value <= 7) return '#EAB308';
  if (value <= 9) return '#84CC16';
  return '#22C55E';
}

function energyLabel(value: number): string {
  if (value <= 2) return 'Exhausted';
  if (value <= 4) return 'Low';
  if (value <= 6) return 'Moderate';
  if (value <= 8) return 'High';
  return 'Energized!';
}

export default function EnergySlider({ value, onChange }: Props) {
  const color = energyColor(value);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.label}>{energyLabel(value)}</Text>
        <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={[styles.badgeText, { color }]}>{value} / 10</Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={color}
      />
      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>1</Text>
        <Text style={styles.scaleText}>10</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  slider: { width: '100%', height: 40 },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  scaleText: { fontSize: 11, color: COLORS.subtext },
});
