import type { AchievementCheckStats } from "@/src/domain/entities/achievement";
import { ACHIEVEMENTS } from "@/src/domain/services/achievement-service";
import { getLevelInfo, getLevelProgress, calculateTotalDailyXp } from "@/src/domain/services/points-system";
import { useMemo } from "react";

export function useAchievementsViewModel(
  steps: number,
  calories: number,
  distance?: number,
) {
  const checkStats: AchievementCheckStats = useMemo(() => ({
    totalSteps: steps,
    totalCalories: calories,
    totalDistanceMeters: distance ?? 0,
    currentDaySteps: steps,
    currentDayCalories: calories,
    streakDays: 0,
    challengesWon: 0,
    challengesParticipated: 0,
    friendsCount: 0,
    workoutsLogged: 0,
  }), [steps, calories, distance]);

  const dailyXp = useMemo(() => calculateTotalDailyXp(steps, calories), [steps, calories]);
  const levelInfo = useMemo(() => getLevelInfo(dailyXp), [dailyXp]);
  const levelProgress = useMemo(() => getLevelProgress(dailyXp), [dailyXp]);

  const unlockedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((a) => a.condition(checkStats)),
    [checkStats],
  );

  const unlockedCount = unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return {
    checkStats,
    dailyXp,
    levelInfo,
    levelProgress,
    achievements: ACHIEVEMENTS,
    unlockedAchievements,
    unlockedCount,
    totalCount,
  };
}
