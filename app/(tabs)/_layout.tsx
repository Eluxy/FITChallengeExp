import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const retro = {
    tabBarActiveTintColor: "#D33F24",
    tabBarInactiveTintColor: "#8B7355",
    tabBarStyle: {
      backgroundColor: "#FFF5E1",
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
        name="main_page"
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
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account_page"
        options={{
          href: null,
        }}
      />
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
