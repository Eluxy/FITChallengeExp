import { useAuth } from "@/src/context/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";

export default function AccountPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { isConnected, userInfo, isLoading, error, signInWithGoogle, signOut } = useAuth();
  const s = createStyles(colors);

  return (
    <ScrollView
      style={[s.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.headerCard}>
        <MaterialCommunityIcons name="account-circle-outline" size={26} color={colors.text} />
        <Text style={s.headerTitle}>АККАУНТ</Text>
        <MaterialCommunityIcons name="bell-outline" size={24} color={colors.text} />
      </View>

      {error ? (
        <View style={s.errorCard}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {!isConnected ? (
        <View style={s.loginCard}>
          <MaterialCommunityIcons name="account-off-outline" size={80} color={colors.muted} />
          <Text style={s.loginTitle}>Вы не вошли в аккаунт</Text>
          <Text style={s.loginSubtitle}>
            Войдите, чтобы синхронизировать данные и соревноваться с друзьями
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={signInWithGoogle}
            disabled={isLoading}
            style={({ pressed }) => [
              s.loginButton,
              pressed && s.btnPressed,
              isLoading && s.btnDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={20} color={colors.bg} />
                <Text style={s.loginButtonText}>ВОЙТИ ЧЕРЕЗ GOOGLE</Text>
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/login_page")}
            style={({ pressed }) => [s.emailLoginButton, pressed && s.btnPressed]}
          >
            <Text style={s.emailLoginButtonText}>ВОЙТИ ПО EMAIL</Text>
          </Pressable>
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>НЕТ АККАУНТА?</Text>
            <View style={s.dividerLine} />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/register_page")}
            style={({ pressed }) => [s.registerButton, pressed && s.btnPressed]}
          >
            <MaterialCommunityIcons name="account-plus" size={20} color={colors.accent} />
            <Text style={s.registerButtonText}>ЗАРЕГИСТРИРОВАТЬСЯ</Text>
          </Pressable>
        </View>
      ) : (
        <>
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
                <MaterialCommunityIcons name="account" size={60} color={colors.accent} />
              )}
            </View>

            <Text style={s.name}>{userInfo?.name || "Пользователь"}</Text>
            <Text style={s.email}>{userInfo?.email || ""}</Text>
          </View>

          <View style={s.menuCard}>
            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/settings_page")}
            >
              <MaterialCommunityIcons name="cog-outline" size={22} color={colors.accent} style={s.menuIcon} />
              <Text style={s.menuText}>НАСТРОЙКИ</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
            <View style={s.menuDivider} />
            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/friends_page")}
            >
              <MaterialCommunityIcons name="account-group-outline" size={22} color={colors.accent} style={s.menuIcon} />
              <Text style={s.menuText}>ДРУЗЬЯ</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
            <View style={s.menuDivider} />
            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/leaderboard_page")}
            >
              <MaterialCommunityIcons name="trophy-outline" size={22} color={colors.accent} style={s.menuIcon} />
              <Text style={s.menuText}>ЛИДЕРБОРДЫ</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
            <View style={s.menuDivider} />
            <Pressable
              style={s.menuRow}
              onPress={() => router.push("/achievements_page")}
            >
              <MaterialCommunityIcons name="medal-outline" size={22} color={colors.accent} style={s.menuIcon} />
              <Text style={s.menuText}>ДОСТИЖЕНИЯ</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={signOut}
            style={({ pressed }) => [s.logoutButton, pressed && s.btnPressed]}
          >
            <MaterialCommunityIcons name="logout" size={20} color={colors.accent} />
            <Text style={s.logoutText}>ВЫЙТИ ИЗ АККАУНТА</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: 18,
      paddingBottom: 28,
      gap: 14,
    },
    headerCard: {
      backgroundColor: colors.cream,
      borderRadius: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    headerTitle: {
      fontSize: 34,
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.error + "15",
      borderRadius: 12,
      padding: 12,
      gap: 8,
    },
    errorText: { flex: 1, fontSize: 14, color: colors.error },
    loginCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      paddingVertical: 40,
      paddingHorizontal: 24,
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 7,
    },
    loginTitle: {
      fontSize: 24,
      color: colors.text,
      fontFamily: "Rimma_sans",
      marginTop: 16,
      textAlign: "center",
    },
    loginSubtitle: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 24,
    },
    loginButton: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      minWidth: 240,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    loginButtonText: {
      fontSize: 16,
      color: colors.bg,
      fontFamily: "Rimma_sans",
    },
    emailLoginButton: {
      marginTop: 10,
      backgroundColor: colors.cream,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      minWidth: 240,
      alignItems: "center",
      justifyContent: "center",
    },
    emailLoginButtonText: {
      fontSize: 16,
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
      gap: 12,
      width: "100%",
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
    dividerText: { fontSize: 12, color: colors.muted, fontFamily: "Rimma_sans" },
    registerButton: {
      backgroundColor: colors.cream,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
      minWidth: 240,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    registerButtonText: {
      fontSize: 16,
      color: colors.accent,
      fontFamily: "Rimma_sans",
    },
    btnPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    btnDisabled: {
      opacity: 0.6,
    },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      paddingVertical: 24,
      paddingHorizontal: 20,
      alignItems: "center",
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 7,
    },
    avatarCircle: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: colors.cream,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarPhoto: {
      width: 130,
      height: 130,
      borderRadius: 65,
    },
    name: {
      fontSize: 28,
      color: colors.text,
      fontFamily: "Rimma_sans",
      marginTop: 12,
      textAlign: "center",
    },
    email: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 4,
      textAlign: "center",
    },
    menuCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      paddingVertical: 12,
      paddingHorizontal: 16,
      shadowColor: colors.shadow,
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
      color: colors.text,
      fontFamily: "Rimma_sans",
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.divider,
    },
    logoutButton: {
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    logoutText: {
      fontSize: 16,
      color: colors.accent,
      fontFamily: "Rimma_sans",
    },
  });
}
