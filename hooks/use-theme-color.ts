import { AppTheme, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors,
) {
  const theme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colorFromProps = props[theme];
  if (colorFromProps) return colorFromProps;
  return AppTheme[theme][colorName];
}
