import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
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
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { paddingHorizontal: 18, paddingBottom: 24 },
    header: {
      backgroundColor: colors.cream, borderRadius: 18,
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10,
    },
    headerTitle: { fontSize: 34, color: colors.text, fontFamily: "Rimma_sans" },
    headerRight: { flexDirection: "row", alignItems: "center" },
    switchCard: {
      backgroundColor: colors.cream, borderRadius: 24,
      paddingVertical: 6, paddingHorizontal: 16,
      flexDirection: "row", justifyContent: "space-around", marginTop: 10,
    },
    switchActive: { fontSize: 22, color: colors.text, fontFamily: "Rimma_sans" },
    switchItem: { fontSize: 22, color: colors.muted, fontFamily: "Rimma_sans" },
    statsCard: {
      backgroundColor: colors.card, borderRadius: 24, padding: 18, marginTop: 14,
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    periodRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 16, marginBottom: 6,
    },
    navBtn: { padding: 8, borderRadius: 12 },
    navBtnDisabled: { opacity: 0.3 },
    periodText: { fontSize: 26, color: colors.text, fontFamily: "Rimma_sans" },
    metricRow: { marginTop: 14, flexDirection: "row", alignItems: "center" },
    metricCenter: { flex: 1, marginLeft: 10 },
    metricValue: { fontSize: 46, lineHeight: 48, color: colors.text, fontFamily: "Rimma_sans" },
    metricLabel: { marginTop: -2, fontSize: 22, color: colors.muted, fontFamily: "Rimma_sans" },
    metricDelta: { fontSize: 30, color: colors.green, fontFamily: "Rimma_sans" },
    errorText: { marginTop: 10, fontSize: 14, color: colors.error, fontFamily: "Rimma_sans" },
    chartCard: {
      marginTop: 14, backgroundColor: colors.card, borderRadius: 24, padding: 14,
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    chartTitle: {
      fontSize: 18, color: colors.muted, fontFamily: "Rimma_sans",
      textAlign: "center", marginBottom: 8,
    },
    grid: {
      flexDirection: "row", flexWrap: "wrap",
    },
    gridCell: {
      width: "25%", paddingHorizontal: 3, paddingVertical: 5,
      alignItems: "center",
    },
    gridLabel: {
      fontSize: 9, color: colors.muted, fontFamily: "Rimma_sans", marginBottom: 2,
    },
    gridBarBg: {
      width: "100%", height: 6, borderRadius: 3,
      backgroundColor: colors.divider, overflow: "hidden",
    },
    gridBar: {
      height: "100%", borderRadius: 3, backgroundColor: colors.chartBar,
    },
    gridValue: {
      fontSize: 9, color: colors.text, fontFamily: "Rimma_sans", marginTop: 2,
    },
    chartToggleRow: {
      flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 8,
    },
    chartToggle: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans" },
    chartToggleActive: { fontSize: 14, color: colors.text, fontFamily: "Rimma_sans" },
    bestDayCard: {
      marginTop: 14, backgroundColor: colors.card, borderRadius: 24,
      alignItems: "center", paddingVertical: 14,
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    bestDayTop: { fontSize: 18, color: colors.muted, fontFamily: "Rimma_sans" },
    bestDayDate: { marginTop: -4, fontSize: 48, color: colors.text, textAlign: "center", fontFamily: "Rimma_sans" },
    bestDayNumbers: { marginTop: -4, fontSize: 28, color: colors.accent, fontFamily: "Rimma_sans" },
  });
}

const MONTH_NAMES: Record<string, string> = {
  "01": "Янв", "02": "Фев", "03": "Мар", "04": "Апр",
  "05": "Май", "06": "Июн", "07": "Июл", "08": "Авг",
  "09": "Сен", "10": "Окт", "11": "Ноя", "12": "Дек",
};

export default function StatisticsPage() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { userInfo, isConnected, accessToken } = useAuth();
  const {
    period, setPeriod, selectedDate, goNext, goPrev, isNextDisabled,
    stats, isLoading, error, refresh,
  } = useStatisticsViewModel(userInfo?.email, isConnected, accessToken);
  const swipeHandlers = useSwipeableTab("explore");
  const s = createStyles(colors);

  const [chartMode, setChartMode] = useState<"steps" | "calories">("steps");
  const showNav = period === "month" || period === "year";

  const monthlyData =
    period === "year" && stats.dailyBreakdown.length > 0
      ? (() => {
          const map = new Map<string, { steps: number; calories: number }>();
          for (const day of stats.dailyBreakdown) {
            const monthKey = day.date.slice(0, 7);
            const prev = map.get(monthKey) || { steps: 0, calories: 0 };
            prev.steps += day.steps;
            prev.calories += day.calories;
            map.set(monthKey, prev);
          }
          return Array.from(map.entries())
            .map(([m, d]) => ({ month: m, ...d }))
            .sort((a, b) => a.month.localeCompare(b.month));
        })()
      : null;

  const breakdown = monthlyData ?? stats.dailyBreakdown;
  const maxSteps = Math.max(...breakdown.map((d: any) => d.steps), 1);
  const maxCalories = Math.max(...breakdown.map((d: any) => d.calories), 1);

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 6 }]}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }
      {...swipeHandlers}
    >
      <View style={s.header}>
        <Text style={s.headerTitle}>СТАТИСТИКА</Text>
        <View style={s.headerRight} />
      </View>

      <View style={s.switchCard}>
        <Pressable onPress={() => setPeriod("day")}>
          <Text style={period === "day" ? s.switchActive : s.switchItem}>ДЕНЬ</Text>
        </Pressable>
        <Pressable onPress={() => setPeriod("month")}>
          <Text style={period === "month" ? s.switchActive : s.switchItem}>МЕСЯЦ</Text>
        </Pressable>
        <Pressable onPress={() => setPeriod("year")}>
          <Text style={period === "year" ? s.switchActive : s.switchItem}>ГОД</Text>
        </Pressable>
      </View>

      <View style={s.statsCard}>
        <View style={s.periodRow}>
          {showNav && (
            <Pressable onPress={goPrev} style={s.navBtn}>
              <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
            </Pressable>
          )}
          <Text style={s.periodText}>{getPeriodTitle(period, selectedDate)}</Text>
          {showNav && (
            <Pressable
              onPress={goNext}
              style={[s.navBtn, isNextDisabled && s.navBtnDisabled]}
              disabled={isNextDisabled}
            >
              <MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />
            </Pressable>
          )}
        </View>

        <View style={s.metricRow}>
          <MaterialCommunityIcons name="shoe-sneaker" size={34} color={colors.accent} />
          <View style={s.metricCenter}>
            <Text style={s.metricValue}>{stats.totalSteps.toLocaleString("ru-RU")}</Text>
            <Text style={s.metricLabel}>Всего шагов</Text>
          </View>
        </View>

        <View style={s.metricRow}>
          <MaterialCommunityIcons name="fire" size={34} color={colors.accent} />
          <View style={s.metricCenter}>
            <Text style={s.metricValue}>{stats.totalCalories.toLocaleString("ru-RU")}</Text>
            <Text style={s.metricLabel}>Сожжено ккал</Text>
          </View>
        </View>

        <View style={s.metricRow}>
          <MaterialCommunityIcons name="map-marker-distance" size={34} color={colors.accent} />
          <View style={s.metricCenter}>
            <Text style={s.metricValue}>{stats.totalDistance.toLocaleString("ru-RU")}</Text>
            <Text style={s.metricLabel}>Дистанция (м)</Text>
          </View>
        </View>

        <View style={[s.metricRow, { borderTopWidth: 1, borderColor: colors.divider, paddingTop: 12, marginTop: 12 }]}>
          <MaterialCommunityIcons name="chart-line" size={34} color={colors.accent} />
          <View style={s.metricCenter}>
            <Text style={s.metricValue}>{stats.avgSteps.toLocaleString("ru-RU")}</Text>
            <Text style={s.metricLabel}>В среднем шагов/день</Text>
          </View>
        </View>

        <View style={s.metricRow}>
          <MaterialCommunityIcons name="fire" size={34} color={colors.accent} />
          <View style={s.metricCenter}>
            <Text style={s.metricValue}>{stats.avgCalories.toLocaleString("ru-RU")}</Text>
            <Text style={s.metricLabel}>В среднем ккал/день</Text>
          </View>
        </View>

        {error ? <Text style={s.errorText}>{error}</Text> : null}

        {breakdown.length > 0 && period !== "day" && (
          <View style={s.chartCard}>
            <View style={s.chartToggleRow}>
              <Pressable onPress={() => setChartMode("steps")}>
                <Text style={chartMode === "steps" ? s.chartToggleActive : s.chartToggle}>ШАГИ</Text>
              </Pressable>
              <Pressable onPress={() => setChartMode("calories")}>
                <Text style={chartMode === "calories" ? s.chartToggleActive : s.chartToggle}>КАЛОРИИ</Text>
              </Pressable>
            </View>
            <View style={s.grid}>
              {(period === "year" ? (monthlyData ?? []) : stats.dailyBreakdown.slice(-31)).map((item: any, index: number) => {
                const label = monthlyData
                  ? MONTH_NAMES[item.month.slice(5)] ?? item.month.slice(5)
                  : item.date.slice(5);
                const value = chartMode === "steps" ? item.steps : item.calories;
                const maxValue = chartMode === "steps" ? maxSteps : maxCalories;
                const barPercent = Math.max((value / maxValue) * 100, 2);
                return (
                  <View key={index} style={s.gridCell}>
                    <Text style={s.gridLabel}>{label}</Text>
                    <View style={s.gridBarBg}>
                      <View style={[s.gridBar, { width: `${barPercent}%` }]} />
                    </View>
                    <Text style={s.gridValue}>{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={s.bestDayCard}>
          <Text style={s.bestDayTop}>ЛУЧШИЙ ДЕНЬ</Text>
          <Text style={s.bestDayDate}>{stats.bestDayDate.toUpperCase()}</Text>
          <Text style={s.bestDayNumbers}>{stats.bestDaySteps.toLocaleString("ru-RU")} шагов</Text>
        </View>
      </View>
    </ScrollView>
  );
}
