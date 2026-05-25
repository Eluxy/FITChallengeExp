import type { ChallengeType } from "@/src/domain/entities/challenge";
import type { ChallengeRepository } from "@/src/domain/repositories/challenge-repository";
import type { FriendRepository } from "@/src/domain/repositories/friend-repository";
import type { FriendInfo } from "@/src/domain/entities/friend";
import { useCallback, useEffect, useState } from "react";

export function useCreateChallengeViewModel(
  challengeRepository: ChallengeRepository,
  friendRepository: FriendRepository,
  currentUser: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null } | null,
  onSuccess?: (invitedCount: number) => void,
  initialFriendId?: string,
  initialFriendName?: string,
) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChallengeType>("steps");
  const [targetValue, setTargetValue] = useState("");
  const [duration, setDuration] = useState(7);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set(
    initialFriendId ? [initialFriendId] : [],
  ));
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (initialFriendName && !title) {
      setTitle(`Челлендж с ${initialFriendName}`);
    }
  }, []);

  const loadFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const friendsList = await friendRepository.getFriends();
      setFriends(friendsList);
    } catch (err) {
      console.log("Error loading friends:", err);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const toggleFriend = useCallback((friendId: string) => {
    setSelectedFriendIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  }, []);

  const selectedFriends = friends.filter((f) => selectedFriendIds.has(f.userId));

  const handleCreate = useCallback(async () => {
    setError(null);

    if (!currentUser) {
      setError("Войдите в аккаунт");
      return;
    }
    if (!title.trim()) {
      setError("Введите название челленджа");
      return;
    }
    if (!targetValue.trim() || parseInt(targetValue) <= 0) {
      setError("Введите корректное целевое значение");
      return;
    }

    setIsSaving(true);
    try {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      const participants = [
        {
          userId: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email || "Пользователь",
          photoUrl: currentUser.photoURL || null,
          joinedAt: new Date().toISOString(),
          currentValue: 0,
        },
      ];

      const invitedFriends: FriendInfo[] = [];
      for (const friend of selectedFriends) {
        participants.push({
          userId: friend.userId,
          displayName: friend.displayName,
          photoUrl: friend.photoUrl ?? null,
          joinedAt: new Date().toISOString(),
          currentValue: 0,
        });
        invitedFriends.push(friend);
      }

      await challengeRepository.createChallenge({
        title: title.trim(),
        description: description.trim(),
        type,
        targetValue: parseInt(targetValue),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        participants,
      });

      onSuccess?.(invitedFriends.length);
    } catch (err: any) {
      setError(err.message || "Ошибка создания челленджа");
    } finally {
      setIsSaving(false);
    }
  }, [currentUser, title, description, type, targetValue, duration, selectedFriends, challengeRepository, onSuccess]);

  return {
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    targetValue,
    setTargetValue,
    duration,
    setDuration,
    isSaving,
    error,
    friends: friends,
    selectedFriendIds,
    setSelectedFriendIds,
    showFriendSelector,
    setShowFriendSelector,
    isLoadingFriends,
    selectedFriends,
    toggleFriend,
    handleCreate,
  };
}
