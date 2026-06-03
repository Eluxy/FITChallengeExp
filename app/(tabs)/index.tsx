import { useAuth } from "@/src/context/auth-context";
import { useGoogleFitData } from "@/src/presentation/view-models/use-google-fit-data";
import { useSwipeableTab } from "@/src/utils/use-swipeable-tab";
import { NotificationBell } from "@/components/notification-bell";
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const titleFont = Platform.select({
  ios: "Arial Black",
  android: "sans-serif-black",
  default: undefined,
});

const MASCOT_SIZE = 260;
const MASCOT_OFFSET_X = 0;
const MASCOT_OFFSET_Y = 45;

export default function MainPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isConnected } = useAuth();
  const { stats, steps, calories, isLoading, error, refresh, isOffline } =
    useGoogleFitData();
  const swipeHandlers = useSwipeableTab("index");
  const { colors } = useAppTheme();
  const s = createStyles(colors);

  console.log(
    "🖥️ MainPage render - isConnected:",
    isConnected,
    "steps:",
    steps,
    "calories:",
    calories,
    "stats:",
    stats,
  );

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]} {...swipeHandlers}>
      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.push("/settings_page")}
          style={s.headerIconBtn}
        >
          <MaterialCommunityIcons name="menu" size={28} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>FitChallnge</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <NotificationBell color={colors.text} />
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.push("/account_page")}
            style={s.headerIconBtn}
          >
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={28}
              color={colors.text}
            />
          </Pressable>
        </View>
      </View>

      {isOffline ? (
        <View style={s.offlineBanner}>
          <Text style={s.offlineText}>Нет подключения к интернету</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        <Text style={s.progressLabel}>
          ПРОГРЕСС {stats.progressPercent}%
        </Text>

        <View style={s.heroWrap}>
          <View style={s.ring}>
            <Image
              accessibilityIgnoresInvertColors
              contentFit="contain"
              source={require("../../assets/mascot.png")}
              style={[
                s.mascot,
                {
                  width: MASCOT_SIZE,
                  height: MASCOT_SIZE,
                  transform: [
                    { translateX: MASCOT_OFFSET_X },
                    { translateY: MASCOT_OFFSET_Y },
                  ],
                },
              ]}
            />
          </View>
        </View>

        <View style={s.statRow}>
          <Image
            accessibilityIgnoresInvertColors
            contentFit="contain"
            source={require("../../assets/sneaker.png")}
            style={s.statIcon}
          />
          <View style={s.statBarTrack}>
            <View
              style={[s.statBarFill, { width: `${stats.stepsPercent}%` }]}
            />
          </View>
        </View>
        <View style={s.statRow}>
          <Image
            accessibilityIgnoresInvertColors
            contentFit="contain"
            source={require("../../assets/callories.png")}
            style={s.statIcon}
          />
          <View style={s.statBarTrack}>
            <View
              style={[
                s.statBarFill,
                { width: `${stats.caloriesPercent}%` },
              ]}
            />
          </View>
        </View>

        <Text style={s.liveText}>
          {isConnected
            ? `Сегодня: ${steps.toLocaleString("ru-RU")} шагов • ${calories.toLocaleString("ru-RU")} ккал`
            : "Подключите Google Fit в разделе Аккаунт"}
        </Text>
        {error ? <Text style={s.errorText}>{error}</Text> : null}
        {isLoading && isConnected ? (
          <Text style={s.loadingText}>Обновление данных...</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/challenges_page")}
          style={({ pressed }) => [
            s.btnPrimary,
            pressed && s.btnPressed,
          ]}
        >
          <Text style={s.btnText}>ЧЕЛЕНДЖИ</Text>
        </Pressable>

        <View style={s.btnRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/leaderboard_page")}
            style={({ pressed }) => [
              s.btnHalf,
              pressed && s.btnPressed,
            ]}
          >
            <Text style={s.btnTextSmall}>ЛИДЕРБОРДЫ</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/workouts_page")}
            style={({ pressed }) => [
              s.btnHalf,
              pressed && s.btnPressed,
            ]}
          >
            <Text style={s.btnTextSmall}>ТРЕНИРОВКИ</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.cream,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    headerIconBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: 2,
      color: colors.text,
      fontFamily: titleFont,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      alignItems: "center",
    },
    progressLabel: {
      marginTop: 20,
      marginBottom: 16,
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: 1,
      color: colors.text,
      textAlign: "center",
      fontFamily: titleFont,
    },
    heroWrap: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 28,
    },
    ring: {
      width: 240,
      height: 240,
      borderRadius: 120,
      borderWidth: 22,
      borderColor: colors.accent,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    mascot: {
      width: 200,
      height: 200,
    },
    statRow: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      maxWidth: 360,
      marginBottom: 14,
    },
    statIcon: {
      marginRight: 12,
      width: 28,
      height: 28,
    },
    statBarTrack: {
      flex: 1,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.divider,
      overflow: "hidden",
    },
    statBarFill: {
      height: "100%",
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    btnPrimary: {
      width: "100%",
      maxWidth: 360,
      marginTop: 8,
      paddingVertical: 18,
      paddingHorizontal: 24,
      borderRadius: 18,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: { elevation: 5 },
        default: {},
      }),
    },
    btnRow: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
      maxWidth: 360,
      marginTop: 14,
    },
    btnHalf: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: { elevation: 5 },
        default: {},
      }),
    },
    btnPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    btnText: {
      fontSize: 35,
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    btnTextSmall: {
      fontSize: 20,
      color: colors.muted,
      textAlign: "center",
      fontFamily: "Rimma_sans",
    },
    liveText: {
      marginTop: 10,
      fontSize: 14,
      color: colors.text,
      textAlign: "center",
      fontFamily: "Rimma_sans",
    },
    errorText: {
      marginTop: 4,
      fontSize: 13,
      color: colors.error,
      textAlign: "center",
      fontFamily: "Rimma_sans",
    },
    loadingText: {
      marginTop: 4,
      fontSize: 13,
      color: colors.muted,
      textAlign: "center",
      fontFamily: "Rimma_sans",
    },
    offlineBanner: {
      backgroundColor: colors.error,
      paddingVertical: 6,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    offlineText: {
      fontSize: 13,
      color: colors.bg,
      fontFamily: "Rimma_sans",
    },
    actionsRow: {
      width: "100%",
      maxWidth: 360,
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
      marginBottom: 6,
    },
    actionButton: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 10,
      backgroundColor: colors.cream,
      alignItems: "center",
    },
    actionButtonFull: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 10,
      backgroundColor: colors.cream,
      alignItems: "center",
    },
    actionText: {
      fontSize: 14,
      color: colors.accent,
      fontFamily: "Rimma_sans",
    },
  });
}
