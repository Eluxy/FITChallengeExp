import { getFirebaseAuth, getFirebaseDb } from "@/src/config/firebase";
import {
  setupNotifications,
  scheduleDailyReminder,
} from "@/src/services/notifications/notification-service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { cancelAllScheduledNotificationsAsync } from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
  green: "#4CAF50",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export default function NotificationSettingsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
      if (!user) {
        setIsLoading(false);
        return;
      }

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirebaseDb();
      await setDoc(
        doc(db, "users", user.uid),
        {
          reminderEnabled: enabled,
          reminderHour: hour,
          reminderMinute: minute,
        },
        { merge: true },
      );

      if (enabled) {
        await scheduleDailyReminder(hour, minute);
      } else {
        await cancelAllScheduledNotificationsAsync();
      }

      Alert.alert("Сохранено", "Настройки уведомлений сохранены");
      router.back();
    } catch (err) {
      console.log("Error saving notification settings:", err);
      Alert.alert("Ошибка", "Не удалось сохранить настройки");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>УВЕДОМЛЕНИЯ</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="bell-ring-outline" size={24} color={COLORS.accent} />
        <Text style={styles.infoText}>
          Получайте ежедневное напоминание, чтобы проверять свои челленджи и прогресс
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.accent} />
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Ежедневное напоминание</Text>
            <Text style={styles.rowHint}>{enabled ? "Включено" : "Выключено"}</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: "#EBDCC2", true: COLORS.accent }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      {enabled && (
        <View style={styles.card}>
          <Text style={styles.timeSectionTitle}>Время напоминания</Text>

          <View style={styles.timeRow}>
            <View style={styles.timePicker}>
              <Text style={styles.timeLabel}>Часы</Text>
              <ScrollView
                style={styles.timeScroll}
                showsVerticalScrollIndicator={false}
              >
                {HOURS.map((h) => (
                  <Pressable
                    key={h}
                    style={[styles.timeOption, hour === h && styles.timeOptionSelected]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[styles.timeOptionText, hour === h && styles.timeOptionTextSelected]}>
                      {String(h).padStart(2, "0")}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            <View style={styles.timePicker}>
              <Text style={styles.timeLabel}>Минуты</Text>
              <ScrollView
                style={styles.timeScroll}
                showsVerticalScrollIndicator={false}
              >
                {MINUTES.map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.timeOption, minute === m && styles.timeOptionSelected]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.timeOptionText, minute === m && styles.timeOptionTextSelected]}>
                      {String(m).padStart(2, "0")}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <Text style={styles.timePreview}>
            Напоминание в {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
          </Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.saveBtn,
          pressed && styles.btnPressed,
          isSaving && styles.btnDisabled,
        ]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveBtnText}>СОХРАНИТЬ</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 28, color: COLORS.text, fontFamily: "Rimma_sans" },
  infoCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    alignItems: "center",
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.muted },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    elevation: 5,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 18, color: COLORS.text, fontFamily: "Rimma_sans" },
  rowHint: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  timeSectionTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 8,
  },
  timePicker: { alignItems: "center", flex: 1 },
  timeLabel: { fontSize: 14, color: COLORS.muted, fontFamily: "Rimma_sans", marginBottom: 8 },
  timeScroll: { maxHeight: 180 },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 2,
  },
  timeOptionSelected: { backgroundColor: COLORS.accent },
  timeOptionText: { fontSize: 18, color: COLORS.text, textAlign: "center", fontFamily: "Rimma_sans" },
  timeOptionTextSelected: { color: "#FFF" },
  timeSeparator: { fontSize: 28, color: COLORS.text, paddingTop: 30 },
  timePreview: {
    fontSize: 16,
    color: COLORS.accent,
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 18, color: "#FFF", fontFamily: "Rimma_sans" },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
});
