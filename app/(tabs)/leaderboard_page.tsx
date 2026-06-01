import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { useAuth } from "@/src/context/auth-context";
import { useLeaderboardViewModel } from "@/src/presentation/view-models/use-leaderboard-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getMedalColor(index: number, colors: ThemeColors) {
  if (index === 0) return colors.gold;
  if (index === 1) return colors.silver;
  if (index === 2) return colors.bronze;
  return colors.muted;
}

function getMedalIcon(index: number) {
  if (index === 0) return "trophy";
  if (index === 1) return "medal";
  if (index === 2) return "medal-outline";
  return "account";
}

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
    card: {
      backgroundColor: colors.card, borderRadius: 24, padding: 16,
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    cardTitle: { fontSize: 18, color: colors.muted, fontFamily: "Rimma_sans", marginBottom: 8 },
    emptyState: { alignItems: "center", paddingVertical: 32 },
    emptyText: { marginTop: 12, fontSize: 16, color: colors.muted, textAlign: "center", fontFamily: "Rimma_sans" },
    row: {
      flexDirection: "row", alignItems: "center", paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    myRow: { backgroundColor: colors.cream, borderRadius: 12, paddingHorizontal: 8 },
    medal: { marginRight: 10 },
    rowInfo: { flex: 1 },
    rowName: { fontSize: 20, color: colors.text, fontFamily: "Rimma_sans" },
    rowStats: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans" },
    rowRank: { fontSize: 22, color: colors.accent, fontFamily: "Rimma_sans" },
  });
}

export default function LeaderboardPage() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { isConnected, firebaseUser } = useAuth();
  const { leaders, isLoading, error, myUserId, refresh } =
    useLeaderboardViewModel(firebaseUser, isConnected);
  const s = createStyles(colors);

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      <View style={s.header}>
        <MaterialCommunityIcons name="trophy-outline" size={26} color={colors.text} />
        <Text style={s.headerTitle}>ЛИДЕРБОРД</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>СЕГОДНЯ</Text>

        {!isConnected ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="account-off-outline" size={48} color={colors.muted} />
            <Text style={s.emptyText}>Войдите в аккаунт для просмотра лидерборда</Text>
          </View>
        ) : isLoading ? (
          <View style={s.emptyState}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={s.emptyText}>Загрузка...</Text>
          </View>
        ) : error ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.muted} />
            <Text style={s.emptyText}>{error}</Text>
          </View>
        ) : leaders.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="trophy-outline" size={48} color={colors.muted} />
            <Text style={s.emptyText}>Пока нет данных за сегодня</Text>
          </View>
        ) : (
          leaders.map((entry, index) => (
            <View
              key={entry.uid || entry.userId || index}
              style={[s.row, entry.uid === myUserId && s.myRow]}
            >
              <MaterialCommunityIcons
                name={getMedalIcon(index) as any}
                size={28}
                color={getMedalColor(index, colors)}
                style={s.medal}
              />
              <View style={s.rowInfo}>
                <Text style={s.rowName}>
                  {entry.displayName}
                  {entry.uid === myUserId ? " (Вы)" : ""}
                </Text>
                <Text style={s.rowStats}>
                  {entry.steps.toLocaleString("ru-RU")} шагов •{" "}
                  {entry.calories.toLocaleString("ru-RU")} ккал
                </Text>
              </View>
              <Text style={s.rowRank}>#{index + 1}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
