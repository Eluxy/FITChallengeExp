import { useAuth } from "@/src/context/auth-context";
import {
  useStatisticsViewModel,
  getPeriodTitle,
} from "@/src/presentation/view-models/use-statistics-view-model";
import { useSwipeableTab } from "@/src/utils/use-swipeable-tab";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
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
} as const;

export default function StatisticsPage() {
  const insets = useSafeAreaInsets();
  const { userInfo, isConnected } = useAuth();
  const {
    period,
    setPeriod,
    stats,
    isLoading,
    error,
    refresh,
  } = useStatisticsViewModel(userInfo?.email, isConnected);
  const swipeHandlers = useSwipeableTab("explore");

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }
      {...swipeHandlers}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>СТАТИСТИКА</Text>
        <View style={styles.headerRight}></View>
      </View>

      <View style={styles.switchCard}>
        <Pressable onPress={() => setPeriod("day")}>
          <Text
            style={period === "day" ? styles.switchActive : styles.switchItem}
          >
            ДЕНЬ
          </Text>
        </Pressable>
        <Pressable onPress={() => setPeriod("month")}>
          <Text
            style={period === "month" ? styles.switchActive : styles.switchItem}
          >
            МЕСЯЦ
          </Text>
        </Pressable>
        <Pressable onPress={() => setPeriod("year")}>
          <Text
            style={period === "year" ? styles.switchActive : styles.switchItem}
          >
            ГОД
          </Text>
        </Pressable>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.periodText}>{getPeriodTitle(period)}</Text>

        <View style={styles.metricRow}>
          <MaterialCommunityIcons
            name="shoe-sneaker"
            size={34}
            color={COLORS.accent}
          />
          <View style={styles.metricCenter}>
            <Text style={styles.metricValue}>
              {stats.totalSteps.toLocaleString("ru-RU")}
            </Text>
            <Text style={styles.metricLabel}>Всего шагов</Text>
          </View>
          <Text style={styles.metricDelta}>{isLoading ? "..." : "LIVE"}</Text>
        </View>

        <View style={styles.metricRow}>
          <MaterialCommunityIcons name="fire" size={34} color={COLORS.accent} />
          <View style={styles.metricCenter}>
            <Text style={styles.metricValue}>
              {stats.totalCalories.toLocaleString("ru-RU")}
            </Text>
            <Text style={styles.metricLabel}>Сожжено ккал</Text>
          </View>
          <Text style={styles.metricDelta}>FIRE</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.bestDayCard}>
          <Text style={styles.bestDayTop}>ЛУЧШИЙ ДЕНЬ</Text>
          <Text style={styles.bestDayDate}>
            {stats.bestDayDate.toUpperCase()}
          </Text>
          <Text style={styles.bestDayNumbers}>
            {stats.bestDaySteps.toLocaleString("ru-RU")} шагов
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  header: {
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 34,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 14,
  },
  switchActive: {
    fontSize: 24,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  switchItem: {
    fontSize: 24,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  statsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    marginTop: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  periodText: {
    fontSize: 26,
    color: COLORS.text,
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
  metricRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  metricCenter: {
    flex: 1,
    marginLeft: 10,
  },
  metricValue: {
    fontSize: 46,
    lineHeight: 48,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  metricLabel: {
    marginTop: -2,
    fontSize: 22,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  metricDelta: {
    fontSize: 30,
    color: COLORS.green,
    fontFamily: "Rimma_sans",
  },
  graphPlaceholder: {
    marginTop: 16,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#EFE1CB",
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: "#A4371D",
    fontFamily: "Rimma_sans",
  },
  bestDayCard: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    alignItems: "center",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  bestDayTop: {
    fontSize: 18,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  bestDayDate: {
    marginTop: -4,
    fontSize: 48,
    color: COLORS.text,
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
  bestDayNumbers: {
    marginTop: -4,
    fontSize: 28,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
});
