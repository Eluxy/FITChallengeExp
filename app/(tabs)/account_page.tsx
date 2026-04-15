import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#EAD4A6",
  cream: "#F3E4C4",
  creamDark: "#EEDDB9",
  text: "#111111",
  accent: "#D33F24",
} as const;

export default function AccountPage() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>АККАУНТ</Text>
      </View>

      <View style={styles.avatarWrap}>
        <View style={styles.avatarCircle}>
          <Image
            accessibilityIgnoresInvertColors
            contentFit="contain"
            source={require("../../assets/mascot.png")}
            style={styles.avatarImage}
          />
        </View>
      </View>

      <Text style={styles.name}>NAME</Text>

      <View style={styles.metricsRow}>
        <Text style={styles.metricLabel}>AGE: </Text>
        <Text style={styles.metricValue}>20</Text>
      </View>
      <View style={styles.metricsRow}>
        <Text style={styles.metricLabel}>HEIGHT: </Text>
        <Text style={styles.metricValue}>175</Text>
        <Text style={styles.metricLabel}> | WEIGHT: </Text>
        <Text style={styles.metricValue}>72</Text>
      </View>

      <View style={styles.menuCard}>
        <View style={styles.menuRow}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={20}
            color={COLORS.accent}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>НАСТРОЙКИ</Text>
        </View>
        <View style={styles.menuRow}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={20}
            color={COLORS.accent}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>ТОВАРИЩИ</Text>
        </View>
        <View style={styles.menuRow}>
          <MaterialCommunityIcons
            name="trophy-outline"
            size={20}
            color={COLORS.accent}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>ЛИДЕРБОРДЫ</Text>
        </View>
        <View style={styles.menuRow}>
          <MaterialCommunityIcons
            name="medal-outline"
            size={20}
            color={COLORS.accent}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>ДОСТИЖЕНИЯ</Text>
        </View>
      </View>

      <View style={styles.bottomCard} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
  },
  headerCard: {
    width: "100%",
    backgroundColor: COLORS.creamDark,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  headerTitle: {
    fontSize: 40,
    color: COLORS.text,
    letterSpacing: 1,
    fontFamily: "Rimma_sans",
  },
  avatarWrap: {
    marginTop: 22,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 158,
    height: 158,
    borderRadius: 79,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 110,
    height: 110,
  },
  name: {
    fontSize: 40,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
    marginTop: 2,
    lineHeight: 62,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  metricLabel: {
    fontSize: 20,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  metricValue: {
    fontSize: 20,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
  menuCard: {
    marginTop: 16,
    width: "78%",
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 7,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: 28,
    textAlign: "center",
    marginRight: 6,
  },
  menuIconSpacer: {
    width: 34,
  },
  menuText: {
    fontSize: 25,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
    lineHeight: 40,
  },
  bottomCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 58,
    backgroundColor: COLORS.creamDark,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
});
