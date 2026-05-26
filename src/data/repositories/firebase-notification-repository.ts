import { getFirebaseDb } from "@/src/config/firebase";
import type { AppNotification, NotificationType } from "@/src/domain/entities/notification";
import type { NotificationRepository, UnsubscribeCallback } from "@/src/domain/repositories/notification-repository";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  limit as firestoreLimit,
  Timestamp,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";

function toDateStr(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function notifFromDoc(id: string, data: any): AppNotification {
  return {
    id,
    type: data.type as NotificationType,
    title: data.title ?? "",
    body: data.body ?? "",
    data: data.data ?? undefined,
    isRead: data.isRead ?? false,
    createdAt: toDateStr(data.createdAt),
  };
}

export class FirebaseNotificationRepository implements NotificationRepository {
  private notifsCol(userId: string) {
    return collection(getFirebaseDb(), "users", userId, "notifications");
  }

  async getNotifications(userId: string, limitCount = 50): Promise<AppNotification[]> {
    const q = query(
      this.notifsCol(userId),
      orderBy("createdAt", "desc"),
      firestoreLimit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => notifFromDoc(d.id, d.data()));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      this.notifsCol(userId),
      where("isRead", "==", false),
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  async markAsRead(userId: string, notifId: string): Promise<void> {
    const ref = doc(this.notifsCol(userId), notifId);
    await updateDoc(ref, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      this.notifsCol(userId),
      where("isRead", "==", false),
    );
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map((d) => updateDoc(d.ref, { isRead: true }));
    await Promise.all(promises);
  }

  async deleteNotification(userId: string, notifId: string): Promise<void> {
    const ref = doc(this.notifsCol(userId), notifId);
    await deleteDoc(ref);
  }

  subscribeToNotifications(
    userId: string,
    callback: (notifications: AppNotification[]) => void,
  ): UnsubscribeCallback {
    const q = query(
      this.notifsCol(userId),
      orderBy("createdAt", "desc"),
      firestoreLimit(50),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((d) => notifFromDoc(d.id, d.data()));
      callback(notifs);
    });

    return unsubscribe;
  }
}
