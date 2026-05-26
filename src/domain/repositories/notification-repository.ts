import type { AppNotification } from "@/src/domain/entities/notification";

export type UnsubscribeCallback = () => void;

export interface NotificationRepository {
  getNotifications(userId: string, limitCount?: number): Promise<AppNotification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(userId: string, notifId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(userId: string, notifId: string): Promise<void>;
  subscribeToNotifications(
    userId: string,
    callback: (notifications: AppNotification[]) => void,
  ): UnsubscribeCallback;
}
