import { useAuth } from "@/src/context/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
  red: "#D94A2B",
};

export default function SettingsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userInfo, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.back();
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>НАСТРОЙКИ</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          {userInfo?.photo ? (
            <Image
              accessibilityIgnoresInvertColors
              contentFit="cover"
              source={{ uri: userInfo.photo }}
              style={styles.avatarPhoto}
            />
          ) : (
            <MaterialCommunityIcons name="account" size={50} color={COLORS.accent} />
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userInfo?.name ?? "Пользователь"}</Text>
          <Text style={styles.profileEmail}>{userInfo?.email ?? ""}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>АККАУНТ</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.row}
            onPress={() => router.push("/edit-profile_page")}
          >
            <MaterialCommunityIcons name="account-edit-outline" size={22} color={COLORS.accent} />
            <Text style={styles.rowText}>Редактировать профиль</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.row}
            onPress={() => router.push("/notification-settings_page")}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.accent} />
            <Text style={styles.rowText}>Уведомления</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.row}
            onPress={() => router.push("/privacy_page")}
          >
            <MaterialCommunityIcons name="shield-outline" size={22} color={COLORS.accent} />
            <Text style={styles.rowText}>Конфиденциальность</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ПРИЛОЖЕНИЕ</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.row}
            onPress={() => router.push("/goals_page")}
          >
            <MaterialCommunityIcons name="target" size={22} color={COLORS.accent} />
            <Text style={styles.rowText}>Цели активности</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.row}
            onPress={() => router.push("/theme_page")}
          >
            <MaterialCommunityIcons name="theme-light-dark" size={22} color={COLORS.accent} />
            <Text style={styles.rowText}>Тема оформления</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.row}
            onPress={() => Alert.alert("Язык", "Текущий язык: Русский", [{ text: "OK" }])}
          >
            <MaterialCommunityIcons name="translate" size={22} color={COLORS.accent} />
            <Text style={styles.rowText}>Язык</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="logout" size={20} color={COLORS.red} />
        <Text style={styles.logoutText}>ВЫЙТИ ИЗ АККАУНТА</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cream,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 28, color: COLORS.text, fontFamily: "Rimma_sans" },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    elevation: 5,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarPhoto: { width: 70, height: 70, borderRadius: 35 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 22, color: COLORS.text, fontFamily: "Rimma_sans" },
  profileEmail: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 14, color: COLORS.muted, fontFamily: "Rimma_sans", paddingLeft: 4 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    elevation: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  rowText: { flex: 1, fontSize: 18, color: COLORS.text, fontFamily: "Rimma_sans" },
  divider: { height: 1, backgroundColor: "#EBDCC2" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.cream,
    borderRadius: 16,
    paddingVertical: 16,
  },
  logoutText: { fontSize: 18, color: COLORS.red, fontFamily: "Rimma_sans" },
  pressed: { opacity: 0.8 },
});
