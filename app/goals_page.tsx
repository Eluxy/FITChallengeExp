import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { useGoalsViewModel } from "@/src/presentation/view-models/use-goals-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function GoalsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const s = createStyles(colors);

  const {
    isLoading,
    isSaving,
    dailySteps, setDailySteps,
    dailyCalories, setDailyCalories,
    dailyDistance, setDailyDistance,
    saveGoals,
  } = useGoalsViewModel();

  const handleSave = async () => {
    const error = await saveGoals();
    if (!error) router.back();
    else console.log("Error saving goals:", error);
  };

  if (isLoading) {
    return (
      <View style={[s.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
          </Pressable>
          <Text style={s.headerTitle}>ЦЕЛИ АКТИВНОСТИ</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={s.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.muted} />
          <Text style={s.infoText}>
            Установите ежедневные цели для шагов, калорий и дистанции
          </Text>
        </View>

        <View style={s.formCard}>
          <View style={s.goalRow}>
            <MaterialCommunityIcons name="shoe-sneaker" size={28} color={colors.accent} />
            <View style={s.goalInputWrap}>
              <Text style={s.goalLabel}>Шаги в день</Text>
              <TextInput
                style={s.goalInput}
                value={dailySteps}
                onChangeText={setDailySteps}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.goalRow}>
            <MaterialCommunityIcons name="fire" size={28} color={colors.accent} />
            <View style={s.goalInputWrap}>
              <Text style={s.goalLabel}>Калории в день (ккал)</Text>
              <TextInput
                style={s.goalInput}
                value={dailyCalories}
                onChangeText={setDailyCalories}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.goalRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={28} color={colors.accent} />
            <View style={s.goalInputWrap}>
              <Text style={s.goalLabel}>Дистанция в день (км)</Text>
              <TextInput
                style={s.goalInput}
                value={dailyDistance}
                onChangeText={setDailyDistance}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

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
            <Text style={s.saveBtnText}>СОХРАНИТЬ ЦЕЛИ</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
    headerTitle: { fontSize: 20, color: colors.text, fontFamily: "Rimma_sans", flex: 1, textAlign: "center" },
    infoCard: {
      flexDirection: "row",
      backgroundColor: colors.cream,
      borderRadius: 12,
      padding: 12,
      gap: 8,
      alignItems: "center",
    },
    infoText: { flex: 1, fontSize: 13, color: colors.muted },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      elevation: 5,
    },
    goalRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 8,
    },
    goalInputWrap: { flex: 1 },
    goalLabel: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans" },
    goalInput: {
      backgroundColor: colors.cream,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 18,
      color: colors.text,
      fontFamily: "Rimma_sans",
      marginTop: 4,
    },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: 4 },
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
