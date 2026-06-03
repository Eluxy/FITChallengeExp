import type { Challenge } from "@/src/domain/entities/challenge";
import type { ChallengeRepository } from "@/src/domain/repositories/challenge-repository";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

export function useChallengeDetailViewModel(
  challengeRepository: ChallengeRepository,
  challengeId: string | undefined,
) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChallenge = useCallback(async () => {
    if (!challengeId) return;
    setIsLoading(true);
    try {
      await challengeRepository.checkAndCompleteExpiredChallenges();
      const data = await challengeRepository.getChallenge(challengeId);
      setChallenge(data);
    } catch {
      setError("Не удалось загрузить челлендж");
    } finally {
      setIsLoading(false);
    }
  }, [challengeId, challengeRepository]);

  useFocusEffect(
    useCallback(() => {
      loadChallenge();
    }, [loadChallenge]),
  );

  const joinChallenge = async () => {
    if (!challengeId) return;
    setIsJoining(true);
    try {
      await challengeRepository.joinChallenge(challengeId);
      await loadChallenge();
    } catch (err: any) {
      setError(err.message || "Ошибка");
    } finally {
      setIsJoining(false);
    }
  };

  return {
    challenge,
    isLoading,
    isJoining,
    error,
    joinChallenge,
    refresh: loadChallenge,
  };
}
