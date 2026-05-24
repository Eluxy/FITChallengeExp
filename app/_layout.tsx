import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Appearance, type ColorSchemeName } from "react-native";
import "react-native-reanimated";

import { AuthProvider } from "@/src/context/auth-context";
import {
  setupNotifications,
  scheduleDailyReminder,
} from "@/src/services/notifications/notification-service";
import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rimma_sans: require("../assets/fonts/RIMMA_SANS-BOLD.ttf"),
  });

  const [themeOverride, setThemeOverride] = useState<ColorSchemeName | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        scheduleDailyReminder(20, 0);
        return;
      }

      const db = getFirebaseDb();
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        scheduleDailyReminder(20, 0);
        return;
      }

      const data = snap.data();

      if (data.theme === "light" || data.theme === "dark") {
        setThemeOverride(data.theme);
        Appearance.setColorScheme(data.theme);
      } else {
        setThemeOverride(null);
        Appearance.setColorScheme(null);
      }

      if (data.reminderEnabled) {
        await scheduleDailyReminder(data.reminderHour ?? 20, data.reminderMinute ?? 0);
      } else {
        await scheduleDailyReminder(20, 0);
      }
    });

    setupNotifications();

    return () => unsubscribe();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const effectiveTheme = themeOverride ?? Appearance.getColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={effectiveTheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
          <Stack.Screen name="login_page" options={{ headerShown: false }} />
          <Stack.Screen name="register_page" options={{ headerShown: false }} />
          <Stack.Screen name="reset-password_page" options={{ headerShown: false }} />
          <Stack.Screen name="settings_page" options={{ headerShown: false }} />
          <Stack.Screen name="friends_page" options={{ headerShown: false }} />
          <Stack.Screen name="achievements_page" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile_page" options={{ headerShown: false }} />
          <Stack.Screen name="goals_page" options={{ headerShown: false }} />
          <Stack.Screen name="create-challenge_page" options={{ headerShown: false }} />
          <Stack.Screen name="challenge-detail_page" options={{ headerShown: false }} />
          <Stack.Screen name="chat_page" options={{ headerShown: false }} />
          <Stack.Screen name="friend-requests_page" options={{ headerShown: false }} />
          <Stack.Screen name="notification-settings_page" options={{ headerShown: false }} />
          <Stack.Screen name="privacy_page" options={{ headerShown: false }} />
          <Stack.Screen name="theme_page" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
