import type { AppNotification } from "@/src/domain/entities/notification";
import type { UnsubscribeCallback } from "@/src/domain/repositories/notification-repository";
import {
  setupNotifications,
  scheduleDailyReminder,
  handleNotificationResponse,
} from "@/src/services/notifications/notification-service";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServices } from "@/src/context/service-provider";

export type { AppNotification };

export function useNotificationsViewModel(
  userId: string | null | undefined,
) {
  const { notificationRepository } = useServices();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotif, setLatestNotif] = useState<AppNotification | null>(null);
  const unsubscribeRef = useRef<UnsubscribeCallback | null>(null);
  const prevUnreadRef = useRef(0);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = notificationRepository.subscribeToNotifications(userId, (notifs) => {
      setNotifications(notifs);
      const newUnread = notifs.filter((n) => !n.isRead).length;
      const prevUnread = prevUnreadRef.current;
      prevUnreadRef.current = newUnread;
      setUnreadCount(newUnread);

      if (notifs.length > 0 && newUnread > prevUnread) {
        setLatestNotif(notifs[0]);
      } else if (newUnread === 0) {
        setLatestNotif(null);
      }
    });

    unsubscribeRef.current = unsubscribe;

    notificationRepository.getUnreadCount(userId).then((count) => {
      prevUnreadRef.current = count;
      setUnreadCount(count);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId, notificationRepository]);

  const markAsRead = useCallback(
    async (notifId: string) => {
      if (!userId) return;
      await notificationRepository.markAsRead(userId, notifId);
    },
    [userId, notificationRepository],
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await notificationRepository.markAllAsRead(userId);
  }, [userId, notificationRepository]);

  const deleteNotification = useCallback(
    async (notifId: string) => {
      if (!userId) return;
      await notificationRepository.deleteNotification(userId, notifId);
    },
    [userId, notificationRepository],
  );

  const clearLatestNotif = useCallback(() => {
    setLatestNotif(null);
  }, []);

  const initNotifications = useCallback((onNotificationResponse?: (data: any) => void) => {
    setupNotifications();
    scheduleDailyReminder(20, 0);

    if (onNotificationResponse) {
      return handleNotificationResponse(onNotificationResponse);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    latestNotif,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearLatestNotif,
    initNotifications,
  };
}
