import { useAuth } from "@/src/context/auth-context";
import { useGoogleFitData } from "@/src/presentation/view-models/use-google-fit-data";
import { useSwipeableTab } from "@/src/utils/use-swipeable-tab";
import { NotificationBell } from "@/components/notification-bell";
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

const COLORS = {
  bg: "#F8EDAD",
  cream: "#F8EDAD", // Changed to match bg
  card: "#F8EDAD", // Changed to match bg
  text: "#ED7C30",
  accent: "#ED7C30", // Changed to match text
  muted: "#B35A22",
} as const;

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
    <View style={[styles.root, { paddingTop: insets.top + 8 }]} {...swipeHandlers}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.push("/settings_page")}
          style={styles.headerIconBtn}
        >
          <MaterialCommunityIcons name="menu" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>FitChallnge</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <NotificationBell color={COLORS.text} />
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.push("/account_page")}
            style={styles.headerIconBtn}
          >
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={28}
              color={COLORS.text}
            />
          </Pressable>
        </View>
      </View>

      {isOffline ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Нет подключения к интернету</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
      >
        <Text style={styles.progressLabel}>
          ПРОГРЕСС {stats.progressPercent}%
        </Text>

        <View style={styles.heroWrap}>
          <View style={styles.ring}>
            <Image
              accessibilityIgnoresInvertColors
              contentFit="contain"
              source={require("../../assets/mascot.png")}
              style={[
                styles.mascot,
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

        <View style={styles.statRow}>
          <Image
            accessibilityIgnoresInvertColors
            contentFit="contain"
            source={require("../../assets/sneaker.png")}
            style={styles.statIcon}
          />
          <View style={styles.statBarTrack}>
            <View
              style={[styles.statBarFill, { width: `${stats.stepsPercent}%` }]}
            />
          </View>
        </View>
        <View style={styles.statRow}>
          <Image
            accessibilityIgnoresInvertColors
            contentFit="contain"
            source={require("../../assets/callories.png")}
            style={styles.statIcon}
          />
          <View style={styles.statBarTrack}>
            <View
              style={[
                styles.statBarFill,
                { width: `${stats.caloriesPercent}%` },
              ]}
            />
          </View>
        </View>

        <Text style={styles.liveText}>
          {isConnected
            ? `Сегодня: ${steps.toLocaleString("ru-RU")} шагов • ${calories.toLocaleString("ru-RU")} ккал`
            : "Подключите Google Fit в разделе Аккаунт"}
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading && isConnected ? (
          <Text style={styles.loadingText}>Обновление данных...</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/challenges_page")}
          style={({ pressed }) => [
            styles.btnPrimary,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.btnText}>ЧЕЛЕНДЖИ</Text>
        </Pressable>

        <View style={styles.btnRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/leaderboard_page")}
            style={({ pressed }) => [
              styles.btnHalf,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnTextSmall}>ЛИДЕРБОРДЫ</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/device_page")}
            style={({ pressed }) => [
              styles.btnHalf,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnTextSmall}>УСТРОЙСТВА</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cream,
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
    color: COLORS.text,
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
    color: COLORS.text,
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
    borderColor: COLORS.accent,
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
    backgroundColor: "#E8D7B8",
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  btnPrimary: {
    width: "100%",
    maxWidth: 360,
    marginTop: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  btnTextSmall: {
    fontSize: 20,
    color: COLORS.muted,
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
  liveText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.text,
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
  errorText: {
    marginTop: 4,
    fontSize: 13,
    color: "#A4371D",
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
  loadingText: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
  offlineBanner: {
    backgroundColor: "#A4371D",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  offlineText: {
    fontSize: 13,
    color: "#fff",
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
    backgroundColor: COLORS.cream,
    alignItems: "center",
  },
  actionButtonFull: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.cream,
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
});
