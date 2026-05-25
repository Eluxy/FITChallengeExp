export type FriendRequest = {
  id: string;
  fromUserId: string;
  fromName: string;
  fromPhoto?: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type FriendInfo = {
  userId: string;
  displayName: string;
  photoUrl?: string;
  lastActive?: string;
};

export type UserSearchResult = {
  userId: string;
  displayName: string;
  photoUrl?: string;
  requestStatus: "none" | "sent" | "received" | "friends";
};
