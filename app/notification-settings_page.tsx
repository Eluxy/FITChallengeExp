import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { useNotificationSettingsViewModel } from "@/src/presentation/view-models/use-notification-settings-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export default function NotificationSettingsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const s = createStyles(colors);

  const {
    isLoading,
    isSaving,
    enabled,
    hour, setHour,
    minute, setMinute,
    handleToggle,
    saveSettings,
  } = useNotificationSettingsViewModel();

  const handleSave = async () => {
    const error = await saveSettings();
    if (error) {
      Alert.alert("Ошибка", error);
    } else {
      Alert.alert("Сохранено", "Настройки уведомлений сохранены");
      router.back();
    }
  };

  if (isLoading) {
    return (
      <View style={[s.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>УВЕДОМЛЕНИЯ</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.infoCard}>
        <MaterialCommunityIcons name="bell-ring-outline" size={24} color={colors.accent} />
        <Text style={s.infoText}>
          Получайте ежедневное напоминание, чтобы проверять свои челленджи и прогресс
        </Text>
      </View>

      <View style={s.card}>
        <View style={s.row}>
          <MaterialCommunityIcons name="bell-outline" size={24} color={colors.accent} />
          <View style={s.rowContent}>
            <Text style={s.rowLabel}>Ежедневное напоминание</Text>
            <Text style={s.rowHint}>{enabled ? "Включено" : "Выключено"}</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.divider, true: colors.accent }}
            thumbColor={colors.bg}
          />
        </View>
      </View>

      {enabled && (
        <View style={s.card}>
          <Text style={s.timeSectionTitle}>Время напоминания</Text>

          <View style={s.timeRow}>
            <View style={s.timePicker}>
              <Text style={s.timeLabel}>Часы</Text>
              <ScrollView
                style={s.timeScroll}
                showsVerticalScrollIndicator={false}
              >
                {HOURS.map((h) => (
                  <Pressable
                    key={h}
                    style={[s.timeOption, hour === h && s.timeOptionSelected]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[s.timeOptionText, hour === h && s.timeOptionTextSelected]}>
                      {String(h).padStart(2, "0")}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Text style={s.timeSeparator}>:</Text>

            <View style={s.timePicker}>
              <Text style={s.timeLabel}>Минуты</Text>
              <ScrollView
                style={s.timeScroll}
                showsVerticalScrollIndicator={false}
              >
                {MINUTES.map((m) => (
                  <Pressable
                    key={m}
                    style={[s.timeOption, minute === m && s.timeOptionSelected]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[s.timeOptionText, minute === m && s.timeOptionTextSelected]}>
                      {String(m).padStart(2, "0")}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <Text style={s.timePreview}>
            Напоминание в {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
          </Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          s.saveBtn,
          pressed && s.btnPressed,
          isSaving && s.btnDisabled,
        ]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={s.saveBtnText}>СОХРАНИТЬ</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cream,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    headerTitle: { fontSize: 28, color: colors.text, fontFamily: "Rimma_sans" },
    infoCard: {
      flexDirection: "row",
      backgroundColor: colors.cream,
      borderRadius: 12,
      padding: 12,
      gap: 8,
      alignItems: "center",
    },
    infoText: { flex: 1, fontSize: 13, color: colors.muted },
    card: {
      backgroundColor: colors.card,
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
    rowLabel: { fontSize: 18, color: colors.text, fontFamily: "Rimma_sans" },
    rowHint: { fontSize: 13, color: colors.muted, marginTop: 2 },
    timeSectionTitle: {
      fontSize: 16,
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "center",
      gap: 8,
    },
    timePicker: { alignItems: "center", flex: 1 },
    timeLabel: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans", marginBottom: 8 },
    timeScroll: { maxHeight: 180 },
    timeOption: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginVertical: 2,
    },
    timeOptionSelected: { backgroundColor: colors.accent },
    timeOptionText: { fontSize: 18, color: colors.text, textAlign: "center", fontFamily: "Rimma_sans" },
    timeOptionTextSelected: { color: colors.bg },
    timeSeparator: { fontSize: 28, color: colors.text, paddingTop: 30 },
    timePreview: {
      fontSize: 16,
      color: colors.accent,
      textAlign: "center",
      fontFamily: "Rimma_sans",
    },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    saveBtnText: { fontSize: 18, color: colors.bg, fontFamily: "Rimma_sans" },
    btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    btnDisabled: { opacity: 0.6 },
  });
}
