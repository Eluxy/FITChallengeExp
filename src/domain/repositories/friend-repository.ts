import type { FriendInfo, FriendRequest, UserSearchResult } from "@/src/domain/entities/friend";

export interface FriendRepository {
  searchUsers(searchQuery: string): Promise<UserSearchResult[]>;
  getSentRequests(): Promise<FriendRequest[]>;
  sendFriendRequest(toUserId: string): Promise<{ success: boolean; message: string }>;
  acceptFriendRequest(requestId: string): Promise<{ success: boolean; message: string }>;
  rejectFriendRequest(requestId: string): Promise<{ success: boolean; message: string }>;
  getPendingRequests(): Promise<FriendRequest[]>;
  getFriends(): Promise<FriendInfo[]>;
  removeFriend(friendUserId: string): Promise<{ success: boolean; message: string }>;
}
