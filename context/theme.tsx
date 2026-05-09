import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextType = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  resolvedScheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType>({
  preference: 'system',
  setPreference: () => {},
  resolvedScheme: 'light',
});

const STORAGE_KEY = 'theme_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setPreferenceState(val);
      }
    });
  }, []);

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p);
  };

  const resolvedScheme = preference === 'system' ? systemScheme : preference;

  return (
    <ThemeContext.Provider value={{ preference, setPreference, resolvedScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
