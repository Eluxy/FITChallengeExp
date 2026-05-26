import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Appearance, View } from "react-native";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/src/context/auth-context";
import { ServiceProvider, useServices } from "@/src/context/service-provider";
import { useThemeInitializer } from "@/src/presentation/view-models/use-theme-initializer";
import { useNotificationsViewModel } from "@/src/presentation/view-models/use-notifications-view-model";
import type { AppNotification } from "@/src/domain/entities/notification";
import { InAppToast } from "@/components/in-app-toast";
import {
  setupNotifications,
  scheduleDailyReminder,
} from "@/src/services/notifications/notification-service";

export const unstable_settings = {
  anchor: "(tabs)",
};

function ToastManager() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { notificationRepository } = useServices();
  const { latestNotif, clearLatestNotif } = useNotificationsViewModel(
    notificationRepository,
    firebaseUser?.uid,
  );

  const handleToastPress = (notif: AppNotification) => {
    const data = notif.data;
    clearLatestNotif();
    if (!data) return;
    if (data.challengeId) {
      router.push(`/challenge-detail_page?id=${data.challengeId}`);
    } else if (data.achievementId) {
      router.push("/achievements_page");
    } else {
      router.push("/notifications_page");
    }
  };

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 9999 }}>
      <InAppToast
        notification={latestNotif}
        onDismiss={clearLatestNotif}
        onPress={handleToastPress}
      />
    </View>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const themeOverride = useThemeInitializer();

  useEffect(() => {
    setupNotifications();
    scheduleDailyReminder(20, 0);
  }, []);

  const effectiveTheme = themeOverride ?? Appearance.getColorScheme();

  return (
    <ThemeProvider value={effectiveTheme === "dark" ? DarkTheme : DefaultTheme}>
      {children}
      <ToastManager />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rimma_sans: require("../assets/fonts/RIMMA_SANS-BOLD.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ServiceProvider>
        <LayoutContent>
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
            <Stack.Screen name="notifications_page" options={{ headerShown: false }} />
            <Stack.Screen name="privacy_page" options={{ headerShown: false }} />
            <Stack.Screen name="theme_page" options={{ headerShown: false }} />
          </Stack>
        </LayoutContent>
      </ServiceProvider>
    </AuthProvider>
  );
}
