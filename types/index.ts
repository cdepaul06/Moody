export interface MoodEntry {
  id: string;
  user_id: string;
  mood: number;
  energy: number;
  activities: string[];
  notes: string;
  created_at: string;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export const MOOD_CONFIG: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: '😞', label: 'Very Bad', color: '#EF4444' },
  2: { emoji: '😕', label: 'Bad', color: '#F97316' },
  3: { emoji: '😐', label: 'Neutral', color: '#EAB308' },
  4: { emoji: '🙂', label: 'Good', color: '#84CC16' },
  5: { emoji: '😊', label: 'Great', color: '#22C55E' },
};

export const ACTIVITIES = [
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'exercise', label: 'Exercise', emoji: '🏃' },
  { id: 'eating', label: 'Eating', emoji: '🍽️' },
  { id: 'socializing', label: 'Socializing', emoji: '👥' },
  { id: 'resting', label: 'Resting', emoji: '😴' },
  { id: 'reading', label: 'Reading', emoji: '📚' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'tv', label: 'Watching TV', emoji: '📺' },
  { id: 'outdoors', label: 'Outdoors', emoji: '🌿' },
  { id: 'cooking', label: 'Cooking', emoji: '🍳' },
  { id: 'meditation', label: 'Meditation', emoji: '🧘' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
];

export const COLORS = {
  primary: '#7C3AED',
  primaryLight: '#EDE9FE',
  background: '#F5F3FF',
  card: '#FFFFFF',
  text: '#1F2937',
  subtext: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
};
