import type { Challenge } from "@/src/domain/entities/challenge";
import type { ChallengeRepository } from "@/src/domain/repositories/challenge-repository";
import { useCallback, useEffect, useState } from "react";

export type ChallengesTab = "active" | "system" | "completed";

export function useChallengesViewModel(
  challengeRepository: ChallengeRepository,
  userId: string | null | undefined,
) {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [systemChallenges, setSystemChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadChallenges = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await challengeRepository.checkAndCompleteExpiredChallenges();
      const [allChallenges, system] = await Promise.all([
        challengeRepository.getUserChallenges(userId),
        challengeRepository.getSystemChallenges(),
      ]);
      setActiveChallenges(
        allChallenges.filter(
          (c) => c.status === "active" || c.status === "pending",
        ),
      );
      setSystemChallenges(system);
    } catch (err) {
      console.log("Error loading challenges:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, challengeRepository]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  return {
    activeChallenges,
    systemChallenges,
    isLoading,
    refresh: loadChallenges,
  };
}
