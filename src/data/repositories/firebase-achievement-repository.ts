import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import type { UserAchievement } from "@/src/domain/entities/achievement";
import type { AchievementRepository } from "@/src/domain/repositories/achievement-repository";
import { ACHIEVEMENTS } from "@/src/domain/services/achievement-service";
import { createNotification } from "@/src/services/notifications/create-notification";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
} from "firebase/firestore";

export class FirebaseAchievementRepository implements AchievementRepository {
  private get achievementsCol() {
    return collection(getFirebaseDb(), "achievements");
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const q = query(this.achievementsCol, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.data().achievementId as string,
      unlockedAt: d.data().unlockedAt as string,
    }));
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    const docRef = doc(this.achievementsCol);
    await setDoc(docRef, {
      userId,
      achievementId,
      unlockedAt: new Date().toISOString(),
    });

    const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
    const title = def?.title ?? achievementId;
    await createNotification(
      userId,
      "achievement",
      "Новое достижение!",
      `Вы открыли достижение "${title}"`,
      { achievementId },
    );
  }

  async isAchievementUnlocked(userId: string, achievementId: string): Promise<boolean> {
    const q = query(
      this.achievementsCol,
      where("userId", "==", userId),
      where("achievementId", "==", achievementId),
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }
}
