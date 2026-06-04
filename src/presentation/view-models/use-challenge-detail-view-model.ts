import type { Challenge } from "@/src/domain/entities/challenge";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useServices } from "@/src/context/service-provider";

export type { Challenge } from "@/src/domain/entities/challenge";
export { getChallengeUnit, getChallengeIcon } from "@/src/domain/entities/challenge";

export function useChallengeDetailViewModel(
  challengeId: string | undefined,
) {
  const { challengeRepository } = useServices();
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

  const deleteChallenge = async (challengeIdToDelete: string): Promise<void> => {
    try {
      await challengeRepository.deleteChallenge(challengeIdToDelete);
    } catch (err: any) {
      Alert.alert("Ошибка", err.message);
      throw err;
    }
  };

  return {
    challenge,
    isLoading,
    isJoining,
    error,
    joinChallenge,
    deleteChallenge,
    refresh: loadChallenge,
  };
}
