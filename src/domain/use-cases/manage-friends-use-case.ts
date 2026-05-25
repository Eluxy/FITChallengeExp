import type { FriendInfo, FriendRequest, UserSearchResult } from "@/src/domain/entities/friend";
import type { FriendRepository } from "@/src/domain/repositories/friend-repository";

export class ManageFriendsUseCase {
  constructor(private readonly friendRepository: FriendRepository) {}

  searchUsers(query: string): Promise<UserSearchResult[]> {
    return this.friendRepository.searchUsers(query);
  }

  sendFriendRequest(toUserId: string): Promise<{ success: boolean; message: string }> {
    return this.friendRepository.sendFriendRequest(toUserId);
  }

  acceptFriendRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    return this.friendRepository.acceptFriendRequest(requestId);
  }

  rejectFriendRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    return this.friendRepository.rejectFriendRequest(requestId);
  }

  getPendingRequests(): Promise<FriendRequest[]> {
    return this.friendRepository.getPendingRequests();
  }

  getSentRequests(): Promise<FriendRequest[]> {
    return this.friendRepository.getSentRequests();
  }

  getFriends(): Promise<FriendInfo[]> {
    return this.friendRepository.getFriends();
  }

  removeFriend(friendUserId: string): Promise<{ success: boolean; message: string }> {
    return this.friendRepository.removeFriend(friendUserId);
  }
}
