import type { FriendInfo, FriendRequest, UserSearchResult } from "@/src/domain/entities/friend";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useServices } from "@/src/context/service-provider";

export type { UserSearchResult } from "@/src/domain/entities/friend";

export function useFriendsViewModel(
  isConnected: boolean,
) {
  const { friendRepository } = useServices();
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        friendRepository.getFriends(),
        friendRepository.getPendingRequests(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (err) {
      console.log("Error loading friends:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, friendRepository]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await friendRepository.searchUsers(query.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [friendRepository]);

  const handleSendRequest = useCallback(async (userId: string) => {
    setProcessingUserId(userId);
    try {
      await friendRepository.sendFriendRequest(userId);
      const updatedResults = searchResults.map((r) =>
        r.userId === userId ? { ...r, requestStatus: "sent" as const } : r,
      );
      setSearchResults(updatedResults);
    } catch {
      // ignore
    } finally {
      setProcessingUserId(null);
    }
  }, [friendRepository, searchResults]);

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    try {
      await friendRepository.acceptFriendRequest(requestId);
      await loadData();
    } catch {
      // ignore
    }
  }, [friendRepository, loadData]);

  const handleRejectRequest = useCallback(async (requestId: string) => {
    try {
      await friendRepository.rejectFriendRequest(requestId);
      await loadData();
    } catch {
      // ignore
    }
  }, [friendRepository, loadData]);

  const handleRemoveFriend = useCallback(async (friendUserId: string) => {
    try {
      await friendRepository.removeFriend(friendUserId);
      await loadData();
    } catch {
      // ignore
    }
  }, [friendRepository, loadData]);

  return {
    friends,
    requests,
    searchQuery,
    searchResults,
    isLoading,
    isSearching,
    processingUserId,
    handleSearch,
    handleSendRequest,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend,
    refresh: loadData,
    setSearchQuery: (q: string) => {
      setSearchQuery(q);
      if (!q) setSearchResults([]);
    },
  };
}
