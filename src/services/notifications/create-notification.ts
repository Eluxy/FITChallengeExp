import { getFirebaseDb } from "@/src/config/firebase";
import type { NotificationType } from "@/src/domain/entities/notification";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { sendPushToUser } from "./notification-service";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  if (!userId) return;

  const db = getFirebaseDb();
  const notifRef = doc(collection(db, "users", userId, "notifications"));

  await setDoc(notifRef, {
    type,
    title,
    body,
    data: data ?? null,
    isRead: false,
    createdAt: Timestamp.now(),
  });

  await sendPushToUser(userId, title, body, { ...data, type });
}
