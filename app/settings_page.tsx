import { useAuth } from "@/src/context/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";

export default function SettingsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { userInfo, signOut } = useAuth();
  const s = createStyles(colors);

  const handleSignOut = async () => {
    await signOut();
    router.back();
  };

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>НАСТРОЙКИ</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={s.profileCard}>
        <View style={s.avatarCircle}>
          {userInfo?.photo ? (
            <Image
              accessibilityIgnoresInvertColors
              contentFit="cover"
              source={{ uri: userInfo.photo }}
              style={s.avatarPhoto}
            />
          ) : (
            <MaterialCommunityIcons name="account" size={50} color={colors.accent} />
          )}
        </View>
        <View style={s.profileInfo}>
          <Text style={s.profileName}>{userInfo?.name ?? "Пользователь"}</Text>
          <Text style={s.profileEmail}>{userInfo?.email ?? ""}</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>АККАУНТ</Text>
        <View style={s.card}>
          <Pressable
            style={s.row}
            onPress={() => router.push("/edit-profile_page")}
          >
            <MaterialCommunityIcons name="account-edit-outline" size={22} color={colors.accent} />
            <Text style={s.rowText}>Редактировать профиль</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
          <View style={s.divider} />
          <Pressable
            style={s.row}
            onPress={() => router.push("/notification-settings_page")}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.accent} />
            <Text style={s.rowText}>Уведомления</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
          <View style={s.divider} />
          <Pressable
            style={s.row}
            onPress={() => router.push("/privacy_page")}
          >
            <MaterialCommunityIcons name="shield-outline" size={22} color={colors.accent} />
            <Text style={s.rowText}>Конфиденциальность</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>ПРИЛОЖЕНИЕ</Text>
        <View style={s.card}>
          <Pressable
            style={s.row}
            onPress={() => router.push("/goals_page")}
          >
            <MaterialCommunityIcons name="target" size={22} color={colors.accent} />
            <Text style={s.rowText}>Цели активности</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
          <View style={s.divider} />
          <Pressable
            style={s.row}
            onPress={() => router.push("/theme_page")}
          >
            <MaterialCommunityIcons name="theme-light-dark" size={22} color={colors.accent} />
            <Text style={s.rowText}>Тема оформления</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
          <View style={s.divider} />
          <Pressable
            style={s.row}
            onPress={() => Alert.alert("Язык", "Текущий язык: Русский", [{ text: "OK" }])}
          >
            <MaterialCommunityIcons name="translate" size={22} color={colors.accent} />
            <Text style={s.rowText}>Язык</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => [s.logoutBtn, pressed && s.pressed]}
      >
        <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
        <Text style={s.logoutText}>ВЫЙТИ ИЗ АККАУНТА</Text>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 18, paddingBottom: 32, gap: 14 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cream,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    headerTitle: { fontSize: 28, color: colors.text, fontFamily: "Rimma_sans" },
    profileCard: {
      backgroundColor: colors.card,
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
      backgroundColor: colors.cream,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarPhoto: { width: 70, height: 70, borderRadius: 35 },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 22, color: colors.text, fontFamily: "Rimma_sans" },
    profileEmail: { fontSize: 13, color: colors.muted, marginTop: 2 },
    section: { gap: 6 },
    sectionTitle: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans", paddingLeft: 4 },
    card: {
      backgroundColor: colors.card,
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
    rowText: { flex: 1, fontSize: 18, color: colors.text, fontFamily: "Rimma_sans" },
    divider: { height: 1, backgroundColor: colors.divider },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.cream,
      borderRadius: 16,
      paddingVertical: 16,
    },
    logoutText: { fontSize: 18, color: colors.error, fontFamily: "Rimma_sans" },
    pressed: { opacity: 0.8 },
  });
}
