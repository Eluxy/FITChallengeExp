import type { FriendRequest } from "@/src/domain/entities/friend";
import type { FriendRepository } from "@/src/domain/repositories/friend-repository";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

export function useFriendRequestsViewModel(
  friendRepository: FriendRepository,
  isConnected: boolean,
  onSendPush?: (userId: string, title: string, body: string) => void,
) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    if (!isConnected) return;
    try {
      const data = await friendRepository.getPendingRequests();
      setRequests(data);
    } catch (err) {
      console.log("Error loading requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, friendRepository]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests]),
  );

  const handleAccept = useCallback(async (id: string, req?: FriendRequest) => {
    try {
      const result = await friendRepository.acceptFriendRequest(id);
      if (result.success) {
        if (req?.fromUserId) {
          onSendPush?.(req.fromUserId, "Заявка принята", "Пользователь принял вашу заявку в друзья!");
        }
        await loadRequests();
      }
    } catch {
      // ignore
    }
  }, [friendRepository, loadRequests, onSendPush]);

  const handleReject = useCallback(async (id: string) => {
    try {
      await friendRepository.rejectFriendRequest(id);
      await loadRequests();
    } catch {
      // ignore
    }
  }, [friendRepository, loadRequests]);

  return {
    requests,
    isLoading,
    handleAccept,
    handleReject,
    refresh: loadRequests,
  };
}
