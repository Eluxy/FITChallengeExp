import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import {
  getExpoPushTokenAsync,
  AndroidImportance,
  setNotificationChannelAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  addNotificationResponseReceivedListener,
  scheduleNotificationAsync,
  NotificationTriggerInput,
  SchedulableTriggerInputTypes,
  cancelAllScheduledNotificationsAsync,
} from "expo-notifications";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Platform } from "react-native";

export async function setupNotifications() {
  if (Platform.OS === "android") {
    await setNotificationChannelAsync("challenges", {
      name: "Челленджи",
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 50, 100],
    });
    await setNotificationChannelAsync("social", {
      name: "Социальные",
      importance: AndroidImportance.DEFAULT,
    });
    await setNotificationChannelAsync("achievements", {
      name: "Достижения",
      importance: AndroidImportance.HIGH,
    });
  }

  const { status: existingStatus } = await getPermissionsAsync();
  if (existingStatus !== "granted") {
    const { status } = await requestPermissionsAsync();
    if (status !== "granted") return null;
  }

  return registerForPushNotifications();
}

async function registerForPushNotifications() {
  try {
    const tokenData = await getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    });
    const token = tokenData.data;

    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (user) {
      const db = getFirebaseDb();
      await setDoc(
        doc(db, "users", user.uid),
        {
          pushToken: token,
          pushTokenPlatform: Platform.OS,
          pushTokenUpdatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    }
    return token;
  } catch {
    return null;
  }
}

export async function sendPushNotification(token: string, title: string, body: string, data?: Record<string, string>) {
  const message = {
    to: token,
    sound: "default" as const,
    title,
    body,
    data: data ?? {},
    priority: "high" as const,
  };

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.log("Error sending push:", err);
  }
}

export async function sendPushToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
  try {
    const db = getFirebaseDb();
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return;
    const pushToken = userDoc.data().pushToken;
    if (pushToken) {
      await sendPushNotification(pushToken, title, body, data);
    }
  } catch {
    // silently fail
  }
}

export async function scheduleDailyReminder(hour: number = 20, minute: number = 0) {
  await cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const triggerDate = new Date(now);
  triggerDate.setHours(hour, minute, 0, 0);

  if (triggerDate <= now) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  const trigger: NotificationTriggerInput = {
    type: SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };

  await scheduleNotificationAsync({
    content: {
      title: "Напоминание",
      body: "Проверьте свои челленджи и прогресс за день!",
      data: { type: "reminder" },
    },
    trigger,
  });
}

export function handleNotificationResponse(handler: (data: any) => void) {
  const subscription = addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    handler(data);
  });
  return () => subscription.remove();
}
