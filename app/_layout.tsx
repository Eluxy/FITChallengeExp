import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/src/context/auth-context";
import { setupNotifications, scheduleDailyReminder } from "@/src/services/notifications/notification-service";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Rimma_sans: require("../assets/fonts/RIMMA_SANS-BOLD.ttf"),
  });

  useEffect(() => {
    setupNotifications().then(() => {
      scheduleDailyReminder(20, 0);
    });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
