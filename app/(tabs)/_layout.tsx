import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const retro = {
    tabBarActiveTintColor: "#ED7C30",
    tabBarInactiveTintColor: "#B35A22",
    tabBarStyle: {
      backgroundColor: "#F8EDAD",
      borderTopColor: "#E8D4A8",
    },
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: retro.tabBarActiveTintColor,
        tabBarInactiveTintColor: retro.tabBarInactiveTintColor,
        tabBarStyle: retro.tabBarStyle,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
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
          title: "Devices",
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
          title: "Challenges",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
