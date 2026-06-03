import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { useAuth } from "@/src/context/auth-context";
import { useSwipeableTab } from "@/src/utils/use-swipeable-tab";
import { useWorkoutsViewModel, WORKOUT_LABELS, WORKOUT_ICONS, formatDuration, formatDistance, type WorkoutType, type WorkoutRecord } from "@/src/presentation/view-models/use-workouts-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WORKOUT_TYPES: WorkoutType[] = ["walking", "running", "cycling", "treadmill"];

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 18, paddingBottom: 24, gap: 14 },
    header: {
      backgroundColor: colors.cream, borderRadius: 18,
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 14,
    },
    headerTitle: { fontSize: 34, color: colors.text, fontFamily: "Rimma_sans" },
    grid: {
      flexDirection: "row", flexWrap: "wrap", gap: 12,
    },
    typeCard: {
      width: "47%", backgroundColor: colors.card, borderRadius: 24,
      padding: 16, alignItems: "center",
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    typeIcon: { marginBottom: 8 },
    typeLabel: { fontSize: 22, color: colors.text, fontFamily: "Rimma_sans" },
    typeDesc: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans", marginTop: 4 },
    sectionTitle: { fontSize: 24, color: colors.text, fontFamily: "Rimma_sans", marginTop: 4 },
    historyCard: {
      backgroundColor: colors.card, borderRadius: 24, padding: 14,
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    historyItem: {
      flexDirection: "row", alignItems: "center", paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    historyLeft: { flex: 1, marginLeft: 10 },
    historyType: { fontSize: 18, color: colors.text, fontFamily: "Rimma_sans" },
    historyMeta: { fontSize: 13, color: colors.muted, fontFamily: "Rimma_sans", marginTop: 2 },
    historyRight: { fontSize: 16, color: colors.accent, fontFamily: "Rimma_sans" },
    emptyState: { alignItems: "center", paddingVertical: 24 },
    emptyText: { fontSize: 16, color: colors.muted, textAlign: "center", fontFamily: "Rimma_sans" },
    typeRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 12 },
    stretch: { flex: 1 },
    filterRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 10 },
    filterChip: {
      paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16,
      backgroundColor: colors.divider,
    },
    filterChipActive: {
      paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16,
      backgroundColor: colors.accent,
    },
    filterText: { fontSize: 13, color: colors.text, fontFamily: "Rimma_sans" },
    filterTextActive: { fontSize: 13, color: colors.bg, fontFamily: "Rimma_sans" },
  });
}

function HistoryItem({ item, colors, s }: { item: WorkoutRecord; colors: ThemeColors; s: ReturnType<typeof createStyles> }) {
  const icon = WORKOUT_ICONS[item.type];
  const label = WORKOUT_LABELS[item.type];
  const date = item.dateIso.slice(5);
  return (
    <View style={s.historyItem}>
      <MaterialCommunityIcons name={icon as any} size={28} color={colors.accent} />
      <View style={s.historyLeft}>
        <Text style={s.historyType}>{label}</Text>
        <Text style={s.historyMeta}>
          {date} • {formatDuration(item.durationSeconds)} • {item.steps} шагов • {formatDistance(item.distanceMeters)}
        </Text>
      </View>
      <Text style={s.historyRight}>{item.calories} ккал</Text>
    </View>
  );
}

export default function WorkoutsPage() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { isConnected } = useAuth();
  const { history, isLoading, loadHistory } = useWorkoutsViewModel();
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<"all" | WorkoutType>("all");
  const swipeHandlers = useSwipeableTab("workouts_page");
  const s = createStyles(colors);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadHistory} />}
      {...swipeHandlers}
    >
      <View style={s.header}>
        <MaterialCommunityIcons name="dumbbell" size={26} color={colors.text} />
        <Text style={s.headerTitle}>ТРЕНИРОВКИ</Text>
      </View>

      <View style={s.grid}>
        {WORKOUT_TYPES.map((type) => (
          <Pressable
            key={type}
            style={s.typeCard}
            onPress={() => {
              if (isConnected) {
                router.push({ pathname: "/workout_session_page", params: { type } });
              }
            }}
          >
            <MaterialCommunityIcons
              name={WORKOUT_ICONS[type] as any}
              size={42}
              color={colors.accent}
              style={s.typeIcon}
            />
            <Text style={s.typeLabel}>{WORKOUT_LABELS[type]}</Text>
            <Text style={s.typeDesc}>
              {type === "walking" ? "На свежем воздухе" :
               type === "running" ? "Интенсивный бег" :
               type === "cycling" ? "Велосипедная прогулка" :
               "В помещении"}
            </Text>
          </Pressable>
        ))}
      </View>

      {!isConnected ? (
        <View style={s.historyCard}>
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="account-off-outline" size={48} color={colors.muted} />
            <Text style={s.emptyText}>Войдите в аккаунт для записи тренировок</Text>
          </View>
        </View>
      ) : (
        <>
          <Text style={s.sectionTitle}>ИСТОРИЯ</Text>
          {history.length > 0 && (
            <View style={s.filterRow}>
              {(["all", ...WORKOUT_TYPES] as const).map((f) => {
                const active = f === typeFilter;
                return (
                  <Pressable
                    key={f}
                    style={active ? s.filterChipActive : s.filterChip}
                    onPress={() => setTypeFilter(f)}
                  >
                    <Text style={active ? s.filterTextActive : s.filterText}>
                      {f === "all" ? "ВСЕ" : WORKOUT_LABELS[f]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <View style={s.historyCard}>
            {history.length === 0 ? (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="run" size={48} color={colors.muted} />
                <Text style={s.emptyText}>Тренировок пока нет</Text>
              </View>
            ) : (
              history
                .filter((item) => typeFilter === "all" || item.type === typeFilter)
                .map((item, index) => (
                  <HistoryItem key={item.id ?? index} item={item} colors={colors} s={s} />
                ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
