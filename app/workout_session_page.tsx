import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { WORKOUT_LABELS, WORKOUT_ICONS, formatDuration, formatDistance, useWorkoutsViewModel } from "@/src/presentation/view-models/use-workouts-view-model";
import type { WorkoutType } from "@/src/presentation/view-models/use-workouts-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 24, paddingBottom: 40 },
    header: {
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingVertical: 12,
    },
    headerTitle: { fontSize: 28, color: colors.text, fontFamily: "Rimma_sans" },
    timerCard: {
      backgroundColor: colors.card, borderRadius: 24, padding: 24,
      alignItems: "center", marginTop: 20,
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    timerLabel: { fontSize: 18, color: colors.muted, fontFamily: "Rimma_sans" },
    timerValue: {
      fontSize: 64, lineHeight: 68, color: colors.text,
      fontFamily: "Rimma_sans", marginTop: 8,
    },
    statsGrid: {
      flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 20,
    },
    statCard: {
      width: "47%", backgroundColor: colors.card, borderRadius: 20, padding: 16,
      alignItems: "center",
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
    },
    statValue: { fontSize: 32, color: colors.text, fontFamily: "Rimma_sans" },
    statLabel: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans", marginTop: 2 },
    gpsBadge: {
      flexDirection: "row", alignItems: "center", gap: 6,
      marginTop: 16, paddingVertical: 8, paddingHorizontal: 16,
      backgroundColor: colors.card, borderRadius: 20, alignSelf: "center",
    },
    gpsText: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans" },
    actions: { flexDirection: "row", gap: 14, marginTop: 28, justifyContent: "center" },
    btnPrimary: {
      backgroundColor: colors.accent, borderRadius: 18, paddingVertical: 16,
      paddingHorizontal: 32, alignItems: "center", minWidth: 120,
    },
    btnSecondary: {
      backgroundColor: colors.card, borderRadius: 18, paddingVertical: 16,
      paddingHorizontal: 32, alignItems: "center", minWidth: 120,
      borderWidth: 2, borderColor: colors.accent,
    },
    btnText: { fontSize: 20, color: colors.bg, fontFamily: "Rimma_sans" },
    btnTextSecondary: { fontSize: 20, color: colors.accent, fontFamily: "Rimma_sans" },
    errorText: { fontSize: 14, color: colors.error, textAlign: "center", marginTop: 12, fontFamily: "Rimma_sans" },
    summaryOverlay: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: colors.overlay, justifyContent: "center", alignItems: "center",
    },
    summaryCard: {
      backgroundColor: colors.card, borderRadius: 24, padding: 28, margin: 32,
      alignItems: "center",
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
    },
    summaryTitle: { fontSize: 28, color: colors.green, fontFamily: "Rimma_sans", marginTop: 12 },
    summaryRow: {
      flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14,
    },
    summaryValue: { fontSize: 22, color: colors.text, fontFamily: "Rimma_sans" },
    summaryLabel: { fontSize: 16, color: colors.muted, fontFamily: "Rimma_sans" },
    splash: {
      flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg,
    },
  });
}

export default function WorkoutSessionPage() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const {
    status,
    elapsed,
    steps,
    distance,
    calories,
    avgSpeed,
    gpsStatus,
    hasGps,
    lastRecord,
    error,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
  } = useWorkoutsViewModel();

  const [initialized, setInitialized] = useState(false);
  const workoutType = type as WorkoutType;
  const s = createStyles(colors);

  useEffect(() => {
    if (type && !initialized) {
      setInitialized(true);
      startWorkout(type as WorkoutType);
    }
  }, [type, initialized, startWorkout]);

  if (!type) {
    return (
      <View style={s.splash}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const gpsColor = gpsStatus === "fixed" ? colors.green : colors.muted;

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={28} color={colors.text} />
          </Pressable>
          <MaterialCommunityIcons
            name={WORKOUT_ICONS[workoutType] as any}
            size={28}
            color={colors.text}
          />
          <Text style={s.headerTitle}>{WORKOUT_LABELS[workoutType]}</Text>
        </View>

        <View style={s.timerCard}>
          <Text style={s.timerLabel}>
            {status === "paused" ? "ПАУЗА" : status === "finished" ? "ЗАВЕРШЕНО" : "ТРЕНЕРУЕМСЯ"}
          </Text>
          <Text style={s.timerValue}>{formatDuration(elapsed)}</Text>
        </View>

        <View style={s.statsGrid}>
          {workoutType !== "cycling" ? (
            <View style={s.statCard}>
              <MaterialCommunityIcons name="shoe-sneaker" size={28} color={colors.accent} />
              <Text style={s.statValue}>{steps.toLocaleString("ru-RU")}</Text>
              <Text style={s.statLabel}>Шагов</Text>
            </View>
          ) : null}
          <View style={s.statCard}>
            <MaterialCommunityIcons name="map-marker-distance" size={28} color={colors.accent} />
            <Text style={s.statValue}>
              {distance >= 1000
                ? `${(distance / 1000).toFixed(2)}`
                : Math.round(distance).toLocaleString("ru-RU")}
            </Text>
            <Text style={s.statLabel}>{distance >= 1000 ? "Км" : "М"}</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="fire" size={28} color={colors.accent} />
            <Text style={s.statValue}>{calories.toLocaleString("ru-RU")}</Text>
            <Text style={s.statLabel}>Ккал</Text>
          </View>
          <View style={s.statCard}>
            <MaterialCommunityIcons name="speedometer" size={28} color={colors.accent} />
            <Text style={s.statValue}>{avgSpeed.toFixed(1)}</Text>
            <Text style={s.statLabel}>Км/ч</Text>
          </View>
        </View>

        {workoutType !== "treadmill" ? (
          <View style={s.gpsBadge}>
            <MaterialCommunityIcons
              name="satellite"
              size={18}
              color={gpsColor}
            />
            <Text style={[s.gpsText, { color: gpsColor }]}>
              {gpsStatus === "searching" ? "Поиск GPS..." :
               gpsStatus === "fixed" ? "GPS подключён" :
               "GPS недоступен"}
            </Text>
          </View>
        ) : (
          <View style={s.gpsBadge}>
            <MaterialCommunityIcons name="run" size={18} color={colors.muted} />
            <Text style={s.gpsText}>Без GPS</Text>
          </View>
        )}

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {status === "running" || status === "paused" ? (
          <View style={s.actions}>
            {status === "running" ? (
              <Pressable style={s.btnSecondary} onPress={pauseWorkout}>
                <Text style={s.btnTextSecondary}>ПАУЗА</Text>
              </Pressable>
            ) : (
              <Pressable style={s.btnPrimary} onPress={resumeWorkout}>
                <Text style={s.btnText}>ПРОДОЛЖИТЬ</Text>
              </Pressable>
            )}
            <Pressable style={s.btnPrimary} onPress={stopWorkout}>
              <Text style={s.btnText}>СТОП</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {lastRecord && status === "finished" ? (
        <View style={s.summaryOverlay}>
          <View style={s.summaryCard}>
            <MaterialCommunityIcons name="check-circle" size={56} color={colors.green} />
            <Text style={s.summaryTitle}>Тренировка сохранена!</Text>
            <View style={s.summaryRow}>
              <MaterialCommunityIcons name="clock-outline" size={22} color={colors.accent} />
              <Text style={s.summaryValue}>{formatDuration(lastRecord.durationSeconds)}</Text>
            </View>
            {lastRecord.type !== "cycling" ? (
              <View style={s.summaryRow}>
                <MaterialCommunityIcons name="shoe-sneaker" size={22} color={colors.accent} />
                <Text style={s.summaryValue}>{lastRecord.steps.toLocaleString("ru-RU")}</Text>
                <Text style={s.summaryLabel}>шагов</Text>
              </View>
            ) : null}
            <View style={s.summaryRow}>
              <MaterialCommunityIcons name="map-marker-distance" size={22} color={colors.accent} />
              <Text style={s.summaryValue}>{formatDistance(lastRecord.distanceMeters)}</Text>
            </View>
            <View style={s.summaryRow}>
              <MaterialCommunityIcons name="fire" size={22} color={colors.accent} />
              <Text style={s.summaryValue}>{lastRecord.calories}</Text>
              <Text style={s.summaryLabel}>ккал</Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
