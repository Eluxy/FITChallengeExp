import { AppTheme, type ThemeColors, type ThemeMode } from "@/constants/theme";

export type { ThemeColors, ThemeMode };
import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

type ThemeContextType = {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: AppTheme.light,
  mode: "light",
  isDark: false,
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const raw = useColorScheme() ?? "light";
  const mode = raw as ThemeMode;

  return (
    <ThemeContext.Provider
      value={{ colors: AppTheme[mode], mode, isDark: mode === "dark" }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
