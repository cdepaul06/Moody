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

export const MOOD_CONFIG: Record<
  number,
  { emoji: string; label: string; color: string }
> = {
  1: { emoji: "😞", label: "Very Bad", color: "#EF4444" },
  2: { emoji: "😕", label: "Bad", color: "#F97316" },
  3: { emoji: "😐", label: "Neutral", color: "#EAB308" },
  4: { emoji: "🙂", label: "Good", color: "#84CC16" },
  5: { emoji: "😊", label: "Great", color: "#22C55E" },
};

export const ACTIVITIES = [
  { id: "work", label: "Work", emoji: "💼" },
  { id: "exercise", label: "Exercise", emoji: "🏃" },
  { id: "eating", label: "Eating", emoji: "🍽️" },
  { id: "socializing", label: "Socializing", emoji: "👥" },
  { id: "resting", label: "Resting", emoji: "😴" },
  { id: "reading", label: "Reading", emoji: "📚" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "tv", label: "Watching TV", emoji: "📺" },
  { id: "outdoors", label: "Outdoors", emoji: "🌿" },
  { id: "cooking", label: "Cooking", emoji: "🍳" },
  { id: "meditation", label: "Meditation", emoji: "🧘" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "creative", label: "Creative", emoji: "🎨" },
  { id: "driving", label: "Driving", emoji: "🚗" },
  { id: "pets", label: "With Pets", emoji: "🐾" },
  { id: "period", label: "Period", emoji: "🩸" },
  { id: "drugs", label: "Drugs/Alcohol", emoji: "🍷" },
];

export const lightColors = {
  primary: "#0D9488",
  primaryLight: "#CCFBF1",
  background: "#F0FDFA",
  card: "#FFFFFF",
  text: "#18181B",
  subtext: "#71717A",
  border: "#E4E4E7",
  danger: "#EF4444",
};

export const darkColors = {
  primary: "#2DD4BF",
  primaryLight: "#134E4A",
  background: "#09090B",
  card: "#18181B",
  text: "#F4F4F5",
  subtext: "#A1A1AA",
  border: "#3F3F46",
  danger: "#F87171",
};

export type ColorScheme = typeof lightColors;
