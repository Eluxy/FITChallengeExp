import type { Challenge, ChallengeType } from "@/src/domain/entities/challenge";
import { useEffect, useRef, useState } from "react";
import { useServices } from "@/src/context/service-provider";

export type { Challenge, ChallengeType } from "@/src/domain/entities/challenge";
export { getChallengeUnit, getChallengeIcon } from "@/src/domain/entities/challenge";

export function useChallengesViewModel(
  userId: string | null | undefined,
  isConnected: boolean,
) {
  const { challengeRepository } = useServices();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const loadChallenges = async () => {
    if (!userId) return;
    setIsLoading(true);

    if (isConnected) {
      try {
        await challengeRepository.checkAndCompleteExpiredChallenges();
      } catch {
        // Non-critical, continue
      }
    }

    let allChallenges: Challenge[] = [];
    let daily: Challenge[] = [];
    let completed: Challenge[] = [];

    const [allResult, dailyResult, completedResult] = await Promise.allSettled([
      challengeRepository.getUserChallenges(userId),
      challengeRepository.getSystemChallenges(),
      challengeRepository.getCompletedChallenges(userId),
    ]);

    if (allResult.status === "fulfilled") {
      allChallenges = allResult.value;
    } else {
      console.log("Error loading user challenges:", allResult.reason);
    }

    if (dailyResult.status === "fulfilled") {
      daily = dailyResult.value;
    } else {
      console.log("Error loading system challenges:", dailyResult.reason);
    }

    if (completedResult.status === "fulfilled") {
      completed = completedResult.value;
    } else {
      console.log("Error loading completed challenges:", completedResult.reason);
    }

    if (mountedRef.current) {
      setActiveChallenges(
        allChallenges.filter(
          (c) => c.status === "active" || c.status === "pending",
        ),
      );
      setDailyChallenges(daily);
      setCompletedChallenges(completed);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [userId, challengeRepository, isConnected]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const createDailyChallenge = async (
    type: ChallengeType,
    targetValue: number,
  ) => {
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
  };

  const deleteChallenge = async (challengeId: string) => {
    await challengeRepository.deleteChallenge(challengeId);
    await loadChallenges();
  };

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
