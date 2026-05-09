import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchDailyProgressRange } from "@/src/data/firebase/firestore-rest";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
  green: "#48B75A",
} as const;

type Period = "day" | "month" | "year";

type StatsState = {
  totalSteps: number;
  totalCalories: number;
  bestDayDate: string;
  bestDaySteps: number;
};

const EMPTY_STATS: StatsState = {
  totalSteps: 0,
  totalCalories: 0,
  bestDayDate: "Нет данных",
  bestDaySteps: 0,
};

function getStartDate(period: Period): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  if (period === "month") {
    date.setDate(1);
  } else if (period === "year") {
    date.setMonth(0, 1);
  }

  return date;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatBestDate(isoDate: string): string {
  try {
    const parsed = new Date(isoDate);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
    }).format(parsed);
  } catch {
    return isoDate;
  }
}

function getPeriodTitle(period: Period): string {
  const now = new Date();
  if (period === "day") {
    return `Сегодня, ${new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now)}`;
  }

  if (period === "month") {
    return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(now);
  }

  return String(now.getFullYear());
}

export default function StatisticsPage() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>("day");
  const [stats, setStats] = useState<StatsState>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressUserId = useMemo(
    () => process.env.EXPO_PUBLIC_PROGRESS_USER_ID ?? "guest",
    [],
  );

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const startDate = getStartDate(period);
      const endDate = new Date();
      const rows = await fetchDailyProgressRange({
        userId: progressUserId,
        startDate: formatIsoDate(startDate),
        endDate: formatIsoDate(endDate),
      });

      if (rows.length === 0) {
        setStats(EMPTY_STATS);
        return;
      }

      let totalSteps = 0;
      let totalCalories = 0;
      let bestDaySteps = 0;
      let bestDayDate = "Нет данных";

      rows.forEach((data) => {
        const steps = data.steps;
        const calories = data.calories;
        const date = data.date;

        totalSteps += steps;
        totalCalories += calories;

        if (steps > bestDaySteps && date) {
          bestDaySteps = steps;
          bestDayDate = formatBestDate(date);
        }
      });

      setStats({
        totalSteps,
        totalCalories,
        bestDayDate,
        bestDaySteps,
      });
    } catch {
      setError("Не удалось загрузить статистику из Firebase");
    } finally {
      setIsLoading(false);
    }
  }, [period, progressUserId]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="chart-line" size={26} color={COLORS.text} />
        <Text style={styles.headerTitle}>СТАТИСТИКА</Text>
        <View style={styles.headerRight}>
          <MaterialCommunityIcons name="heart" size={16} color={COLORS.muted} />
          <MaterialCommunityIcons
            name="triangle"
            size={14}
            color={COLORS.muted}
            style={{ marginLeft: 4 }}
          />
        </View>
      </View>

      <View style={styles.switchCard}>
        <Pressable onPress={() => setPeriod("day")}>
          <Text style={period === "day" ? styles.switchActive : styles.switchItem}>ДЕНЬ</Text>
        </Pressable>
        <Pressable onPress={() => setPeriod("month")}>
          <Text style={period === "month" ? styles.switchActive : styles.switchItem}>МЕСЯЦ</Text>
        </Pressable>
        <Pressable onPress={() => setPeriod("year")}>
          <Text style={period === "year" ? styles.switchActive : styles.switchItem}>ГОД</Text>
        </Pressable>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.periodText}>{getPeriodTitle(period)}</Text>

        <View style={styles.metricRow}>
          <MaterialCommunityIcons name="shoe-sneaker" size={34} color={COLORS.accent} />
          <View style={styles.metricCenter}>
            <Text style={styles.metricValue}>{stats.totalSteps.toLocaleString("ru-RU")}</Text>
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

        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={loadStatistics}
            style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.actionButtonText}>{isLoading ? "ЗАГРУЗКА..." : "ОБНОВИТЬ"}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.bestDayCard}>
        <Text style={styles.bestDayTop}>ЛУЧШИЙ ДЕНЬ</Text>
        <Text style={styles.bestDayDate}>{stats.bestDayDate.toUpperCase()}</Text>
        <Text style={styles.bestDayNumbers}>
          {stats.bestDaySteps.toLocaleString("ru-RU")} шагов
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 18,
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
  actionsRow: {
    marginTop: 14,
    gap: 8,
  },
  actionButton: {
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
  buttonPressed: {
    opacity: 0.85,
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
    fontFamily: "Rimma_sans",
  },
  bestDayNumbers: {
    marginTop: -4,
    fontSize: 28,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
});
