import type { AchievementDef, AchievementCheckStats, UserAchievement } from "@/src/domain/entities/achievement";
import type { AchievementRepository } from "@/src/domain/repositories/achievement-repository";
import { ACHIEVEMENTS, checkAchievements } from "@/src/domain/services/achievement-service";

export class GetAchievementsUseCase {
  constructor(
    private readonly achievementRepository: AchievementRepository,
  ) {}

  getAllDefinitions(): AchievementDef[] {
    return ACHIEVEMENTS;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return this.achievementRepository.getUserAchievements(userId);
  }

  async checkAndUnlock(userId: string, stats: AchievementCheckStats): Promise<AchievementDef[]> {
    const unlocked = await this.achievementRepository.getUserAchievements(userId);
    const unlockedIds = new Set(unlocked.map((u) => u.id));
    const unlockedDefs = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id));

    const newlyEarned = checkAchievements(ACHIEVEMENTS, stats).filter(
      (a) => !unlockedIds.has(a.id),
    );

    for (const achievement of newlyEarned) {
      await this.achievementRepository.unlockAchievement(userId, achievement.id);
    }

    return newlyEarned;
  }
}
