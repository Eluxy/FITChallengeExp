import { useAppTheme } from "@/src/context/theme-context";
import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.tabBg, borderTopColor: colors.divider },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Статистика",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="device_page"
        options={{
          title: "Устройства",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bolt.horizontal.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen name="account_page" options={{ href: null }} />
      <Tabs.Screen name="leaderboard_page" options={{ href: null }} />
      <Tabs.Screen
        name="challenges_page"
        options={{
          title: "Вызовы",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
