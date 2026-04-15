import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#FCE4B3",
  cream: "#FFF5E1",
  red: "#D33F24",
  text: "#1A1A1A",
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

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => {}}
          style={styles.headerIconBtn}
        >
          <MaterialCommunityIcons name="menu" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>FitChallnge</Text>
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.progressLabel}>ПРОГРЕСС 100%</Text>

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
            <View style={[styles.statBarFill, { width: "100%" }]} />
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
            <View style={[styles.statBarFill, { width: "100%" }]} />
          </View>
        </View>

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
            onPress={() => router.push("/explore")}
            style={({ pressed }) => [
              styles.btnHalf,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnTextSmall}>ЛИДЕРБОРДЫ</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/account_page")}
            style={({ pressed }) => [
              styles.btnHalf,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnTextSmall}>ЗАСЛУГИ</Text>
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
    borderColor: COLORS.red,
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
    backgroundColor: `${COLORS.red}33`,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: COLORS.red,
  },
  btnPrimary: {
    width: "100%",
    maxWidth: 360,
    marginTop: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
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
    backgroundColor: COLORS.cream,
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
    fontWeight: "900",
    letterSpacing: 1,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  btnTextSmall: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: COLORS.text,
    textAlign: "center",
    fontFamily: "Rimma_sans",
  },
});
