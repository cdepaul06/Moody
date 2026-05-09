import { useTheme } from '@/context/theme';
import { lightColors, darkColors, ColorScheme } from '@/types';

export function useColors(): ColorScheme {
  const { resolvedScheme } = useTheme();
  return resolvedScheme === 'dark' ? darkColors : lightColors;
}

export type { ColorScheme };
