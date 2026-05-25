import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { cancelAllScheduledNotificationsAsync } from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import {
  setupNotifications,
  scheduleDailyReminder,
} from "@/src/services/notifications/notification-service";

export function useNotificationSettingsViewModel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) { setIsLoading(false); return; }

      const db = getFirebaseDb();
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        setEnabled(data.reminderEnabled ?? false);
        setHour(data.reminderHour ?? 20);
        setMinute(data.reminderMinute ?? 0);
      }
    } catch (err) {
      console.log("Error loading notification settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = useCallback(async (value: boolean) => {
    setEnabled(value);

    if (value) {
      const result = await setupNotifications();
      if (result === null) {
        setPermissionStatus("not-granted");
        setEnabled(false);
        return;
      }
      setPermissionStatus("granted");
      await scheduleDailyReminder(hour, minute);
    } else {
      await cancelAllScheduledNotificationsAsync();
      setPermissionStatus(null);
    }
  }, [hour, minute]);

  const saveSettings = useCallback(async (): Promise<string | null> => {
    setIsSaving(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return "Пользователь не найден";

      const db = getFirebaseDb();
      await setDoc(
        doc(db, "users", user.uid),
        { reminderEnabled: enabled, reminderHour: hour, reminderMinute: minute },
        { merge: true },
      );

      if (enabled) {
        await scheduleDailyReminder(hour, minute);
      } else {
        await cancelAllScheduledNotificationsAsync();
      }

      return null;
    } catch {
      return "Не удалось сохранить настройки";
    } finally {
      setIsSaving(false);
    }
  }, [enabled, hour, minute]);

  return {
    isLoading,
    isSaving,
    enabled,
    hour, setHour,
    minute, setMinute,
    permissionStatus,
    handleToggle,
    saveSettings,
  };
}
