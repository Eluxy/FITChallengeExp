import type { FriendRequest } from "@/src/domain/entities/friend";
import { sendPushToUser } from "@/src/services/notifications/notification-service";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useServices } from "@/src/context/service-provider";

export function useFriendRequestsViewModel(
  isConnected: boolean,
) {
  const { friendRepository } = useServices();
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
          sendPushToUser(req.fromUserId, "Заявка принята", "Пользователь принял вашу заявку в друзья!", { type: "friend_accept" });
        }
        await loadRequests();
      }
    } catch {
      // ignore
    }
  }, [friendRepository, loadRequests]);

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
