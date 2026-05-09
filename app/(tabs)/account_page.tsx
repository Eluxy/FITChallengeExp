import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAccountViewModel } from "@/src/presentation/view-models/use-account-view-model";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
} as const;

export default function AccountPage() {
  const insets = useSafeAreaInsets();
  const { profile } = useAccountViewModel();

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="account-circle-outline" size={26} color={COLORS.text} />
        <Text style={styles.headerTitle}>АККАУНТ</Text>
        <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.text} />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Image
            accessibilityIgnoresInvertColors
            contentFit="contain"
            source={require("../../assets/mascot.png")}
            style={styles.avatarImage}
          />
        </View>

        <Text style={styles.name}>{profile.name}</Text>

        <View style={styles.metricsWrap}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>ВОЗРАСТ</Text>
            <Text style={styles.metricValue}>{profile.age}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>РОСТ</Text>
            <Text style={styles.metricValue}>{profile.heightCm}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>ВЕС</Text>
            <Text style={styles.metricValue}>{profile.weightKg}</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuCard}>
        <Pressable style={styles.menuRow}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={22}
            color={COLORS.accent}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>НАСТРОЙКИ</Text>
        </Pressable>
        <Pressable style={styles.menuRow}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={22}
            color={COLORS.accent}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>ТОВАРИЩИ</Text>
        </Pressable>
        <Pressable style={styles.menuRow}>
          <MaterialCommunityIcons
            name="trophy-outline"
            size={22}
            color={COLORS.accent}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>ЛИДЕРБОРДЫ</Text>
        </Pressable>
        <Pressable style={styles.menuRow}>
          <MaterialCommunityIcons
            name="medal-outline"
            size={22}
            color={COLORS.accent}
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>ДОСТИЖЕНИЯ</Text>
        </Pressable>
      </View>

      <View style={styles.placeholderCard} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    gap: 14,
  },
  headerCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 34,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  avatarCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 90,
    height: 90,
  },
  name: {
    fontSize: 38,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
    marginTop: 8,
  },
  metricsWrap: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-evenly",
    marginTop: 14,
  },
  metricItem: { alignItems: "center" },
  metricLabel: {
    fontSize: 14,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
  },
  metricValue: {
    fontSize: 28,
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },
  menuIcon: {
    width: 30,
    textAlign: "center",
    marginRight: 8,
  },
  menuText: {
    fontSize: 28,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  placeholderCard: {
    height: 70,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
  },
});
