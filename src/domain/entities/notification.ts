export type NotificationType =
  | "challenge_invite"
  | "challenge_win"
  | "challenge_lose"
  | "challenge_end"
  | "challenge_join"
  | "achievement"
  | "friend_request"
  | "friend_accepted"
  | "reminder";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: string;
};
