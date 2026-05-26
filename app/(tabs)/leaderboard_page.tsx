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

const COLORS = {
  bg: "#F8EDAD",
  cream: "#F8EDAD",
  card: "#F8EDAD",
  text: "#ED7C30",
  accent: "#ED7C30",
  muted: "#B35A22",
  green: "#48B75A",
  gold: "#F5C518",
  silver: "#A8A9AD",
  bronze: "#CD7F32",
} as const;

function getMedalColor(index: number) {
  if (index === 0) return COLORS.gold;
  if (index === 1) return COLORS.silver;
  if (index === 2) return COLORS.bronze;
  return COLORS.muted;
}

function getMedalIcon(index: number) {
  if (index === 0) return "trophy";
  if (index === 1) return "medal";
  if (index === 2) return "medal-outline";
  return "account";
}

export default function LeaderboardPage() {
  const insets = useSafeAreaInsets();
  const { isConnected, userInfo } = useAuth();
  const { leaders, isLoading, error, myUserId, refresh } =
    useLeaderboardViewModel(
    userInfo?.email,
    isConnected,
  );

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }
    >
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="trophy-outline"
          size={26}
          color={COLORS.text}
        />
        <Text style={styles.headerTitle}>ЛИДЕРБОРД</Text>

      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>СЕГОДНЯ</Text>

        {!isConnected ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-off-outline"
              size={48}
              color={COLORS.muted}
            />
            <Text style={styles.emptyText}>
              Войдите в аккаунт для просмотра лидерборда
            </Text>
          </View>
        ) : isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.emptyText}>Загрузка...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={48}
              color={COLORS.muted}
            />
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : leaders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={48}
              color={COLORS.muted}
            />
            <Text style={styles.emptyText}>Пока нет данных за сегодня</Text>
          </View>
        ) : (
          leaders.map((entry, index) => (
            <View
              key={entry.userId || index}
              style={[styles.row, entry.userId === myUserId && styles.myRow]}
            >
              <MaterialCommunityIcons
                name={getMedalIcon(index) as any}
                size={28}
                color={getMedalColor(index)}
                style={styles.medal}
              />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>
                  {entry.displayName}
                  {entry.userId === myUserId ? " (Вы)" : ""}
                </Text>
                <Text style={styles.rowStats}>
                  {entry.steps.toLocaleString("ru-RU")} шагов •{" "}
                  {entry.calories.toLocaleString("ru-RU")} ккал
                </Text>
              </View>
              <Text style={styles.rowRank}>#{index + 1}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 24, gap: 14 },
  header: {
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 34, color: COLORS.text, fontFamily: "Rimma_sans" },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  cardTitle: {
    fontSize: 18,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
    marginBottom: 8,
  },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EBDCC2",
  },
  myRow: {
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  medal: { marginRight: 10 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 20, color: COLORS.text, fontFamily: "Rimma_sans" },
  rowStats: { fontSize: 14, color: COLORS.muted, fontFamily: "Rimma_sans" },
  rowRank: { fontSize: 22, color: COLORS.accent, fontFamily: "Rimma_sans" },
});
