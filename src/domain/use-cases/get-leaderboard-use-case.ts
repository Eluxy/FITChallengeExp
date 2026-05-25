import { fetchDailyProgressRange } from "@/src/data/firebase/firestore-rest";

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  totalSteps: number;
  totalCalories: number;
  daysActive: number;
};

export class GetLeaderboardUseCase {
  async execute(userId: string, startDate: string, endDate: string): Promise<LeaderboardEntry[]> {
    const records = await fetchDailyProgressRange({ userId, startDate, endDate });

    const userMap = new Map<string, LeaderboardEntry>();
    for (const record of records) {
      const uid = record.userId ?? "";
      const existing = userMap.get(uid) ?? {
        userId: uid,
        displayName: record.displayName ?? "Пользователь",
        totalSteps: 0,
        totalCalories: 0,
        daysActive: 0,
      };
      existing.totalSteps += record.steps;
      existing.totalCalories += record.calories;
      if (record.steps > 0) existing.daysActive++;
      userMap.set(uid, existing);
    }

    return Array.from(userMap.values()).sort((a, b) => b.totalSteps - a.totalSteps);
  }
}
