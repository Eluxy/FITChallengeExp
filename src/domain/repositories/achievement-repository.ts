import type { UserAchievement } from "@/src/domain/entities/achievement";

export interface AchievementRepository {
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<void>;
  isAchievementUnlocked(userId: string, achievementId: string): Promise<boolean>;
}
