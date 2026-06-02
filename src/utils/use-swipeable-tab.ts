import { router } from "expo-router";
import { useMemo, useRef } from "react";
import { PanResponder } from "react-native";

const SWIPE_THRESHOLD = 50;

type TabName = "index" | "explore" | "workouts_page" | "challenges_page";

const VISIBLE_TABS: TabName[] = [
  "index",
  "explore",
  "workouts_page",
  "challenges_page",
];

export function useSwipeableTab(currentTab: TabName) {
  const tabRef = useRef(currentTab);
  tabRef.current = currentTab;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
        onPanResponderRelease: (_, gs) => {
          const idx = VISIBLE_TABS.indexOf(tabRef.current);
          if (idx === -1) return;

          if (gs.dx < -SWIPE_THRESHOLD && idx < VISIBLE_TABS.length - 1) {
            const next = VISIBLE_TABS[idx + 1];
            router.replace(next === "index" ? "/(tabs)" : `/(tabs)/${next}`);
          } else if (gs.dx > SWIPE_THRESHOLD && idx > 0) {
            const prev = VISIBLE_TABS[idx - 1];
            router.replace(prev === "index" ? "/(tabs)" : `/(tabs)/${prev}`);
          }
        },
      }),
    []
  );

  return panResponder.panHandlers;
}
