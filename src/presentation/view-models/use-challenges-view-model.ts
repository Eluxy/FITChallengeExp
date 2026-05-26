import type { Challenge, ChallengeType } from "@/src/domain/entities/challenge";
import type { ChallengeRepository } from "@/src/domain/repositories/challenge-repository";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

export type ChallengesTab = "active" | "daily" | "completed";

export function useChallengesViewModel(
  challengeRepository: ChallengeRepository,
  userId: string | null | undefined,
) {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadChallenges = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await challengeRepository.checkAndCompleteExpiredChallenges();
      const [allChallenges, daily, completed] = await Promise.all([
        challengeRepository.getUserChallenges(userId),
        challengeRepository.getSystemChallenges(),
        challengeRepository.getCompletedChallenges(userId),
      ]);
      setActiveChallenges(
        allChallenges.filter(
          (c) => c.status === "active" || c.status === "pending",
        ),
      );
      setDailyChallenges(daily);
      setCompletedChallenges(completed);
    } catch (err) {
      console.log("Error loading challenges:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, challengeRepository]);

  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges]),
  );

  const createDailyChallenge = useCallback(
    async (type: ChallengeType, targetValue: number) => {
      if (!userId) throw new Error("Не авторизован");
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      await challengeRepository.createChallenge({
        title: `Ежедневно: ${type}`,
        description: "",
        type,
        targetValue,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isSystem: true,
      });

      await loadChallenges();
    },
    [userId, challengeRepository, loadChallenges],
  );

  const deleteChallenge = useCallback(
    async (challengeId: string) => {
      await challengeRepository.deleteChallenge(challengeId);
      await loadChallenges();
    },
    [challengeRepository, loadChallenges],
  );

  return {
    activeChallenges,
    dailyChallenges,
    completedChallenges,
    isLoading,
    refresh: loadChallenges,
    createDailyChallenge,
    deleteChallenge,
  };
}
