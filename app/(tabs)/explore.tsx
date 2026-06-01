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
import { useSafeAreaInsets } from "react-native-safe-area-context";

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { paddingHorizontal: 18, paddingBottom: 24 },
    header: {
      backgroundColor: colors.cream, borderRadius: 18,
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 14,
    },
    headerTitle: { fontSize: 34, color: colors.text, fontFamily: "Rimma_sans" },
    headerRight: { flexDirection: "row", alignItems: "center" },
    switchCard: {
      backgroundColor: colors.cream, borderRadius: 24,
      paddingVertical: 8, paddingHorizontal: 16,
      flexDirection: "row", justifyContent: "space-around", marginTop: 14,
    },
    switchActive: { fontSize: 24, color: colors.text, fontFamily: "Rimma_sans" },
    switchItem: { fontSize: 24, color: colors.muted, fontFamily: "Rimma_sans" },
    statsCard: {
      backgroundColor: colors.card, borderRadius: 24, padding: 18, marginTop: 14,
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    periodText: { fontSize: 26, color: colors.text, textAlign: "center", fontFamily: "Rimma_sans" },
    metricRow: { marginTop: 14, flexDirection: "row", alignItems: "center" },
    metricCenter: { flex: 1, marginLeft: 10 },
    metricValue: { fontSize: 46, lineHeight: 48, color: colors.text, fontFamily: "Rimma_sans" },
    metricLabel: { marginTop: -2, fontSize: 22, color: colors.muted, fontFamily: "Rimma_sans" },
    metricDelta: { fontSize: 30, color: colors.green, fontFamily: "Rimma_sans" },
    graphPlaceholder: { marginTop: 16, height: 120, borderRadius: 16, backgroundColor: "#EFE1CB" },
    errorText: { marginTop: 10, fontSize: 14, color: colors.error, fontFamily: "Rimma_sans" },
    bestDayCard: {
      marginTop: 14, backgroundColor: colors.card, borderRadius: 24,
      alignItems: "center", paddingVertical: 14,
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    bestDayTop: { fontSize: 18, color: colors.muted, fontFamily: "Rimma_sans" },
    bestDayDate: { marginTop: -4, fontSize: 48, color: colors.text, textAlign: "center", fontFamily: "Rimma_sans" },
    bestDayNumbers: { marginTop: -4, fontSize: 28, color: colors.accent, fontFamily: "Rimma_sans" },
    chartCard: {
      marginTop: 16, backgroundColor: colors.card, borderRadius: 24, padding: 14,
      shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12, shadowRadius: 12, elevation: 7,
    },
    chartTitle: { fontSize: 18, color: colors.muted, fontFamily: "Rimma_sans", textAlign: "center", marginBottom: 10 },
    chartBars: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 130 },
    chartColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end", marginHorizontal: 1 },
    chartBar: { width: "60%", backgroundColor: colors.chartBar, borderRadius: 4, minHeight: 4 },
    chartBarValue: { fontSize: 8, color: colors.muted, fontFamily: "Rimma_sans", marginBottom: 2 },
    chartBarLabel: { fontSize: 8, color: colors.muted, fontFamily: "Rimma_sans", marginTop: 2 },
  });
}

export default function StatisticsPage() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { userInfo, isConnected, accessToken } = useAuth();
  const { period, setPeriod, stats, isLoading, error, refresh } =
    useStatisticsViewModel(userInfo?.email, isConnected, accessToken);
  const swipeHandlers = useSwipeableTab("explore");
  const s = createStyles(colors);

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }
      {...swipeHandlers}
    >
      <View style={s.header}>
        <Text style={s.headerTitle}>СТАТИСТИКА</Text>
        <View style={s.headerRight}></View>
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
        <Text style={s.periodText}>{getPeriodTitle(period)}</Text>

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

        {stats.dailyBreakdown.length > 1 && (
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>ШАГИ ПО ДНЯМ</Text>
            <View style={s.chartBars}>
              {stats.dailyBreakdown.slice(-14).map((day, index) => {
                const maxSteps = Math.max(...stats.dailyBreakdown.map((d) => d.steps), 1);
                const barHeight = Math.max((day.steps / maxSteps) * 100, 4);
                const dayLabel = day.date.slice(5);
                return (
                  <View key={index} style={s.chartColumn}>
                    <Text style={s.chartBarValue}>
                      {day.steps > 999 ? `${(day.steps / 1000).toFixed(1)}k` : day.steps}
                    </Text>
                    <View style={[s.chartBar, { height: barHeight }]} />
                    <Text style={s.chartBarLabel}>{dayLabel}</Text>
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
