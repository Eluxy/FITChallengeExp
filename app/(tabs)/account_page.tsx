import { useAuth } from "@/src/context/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const router = useRouter();
  const { isConnected, userInfo, isLoading, error, signInWithGoogle, signOut } = useAuth();

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

      {error ? (
        <View style={styles.errorCard}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#A4371D" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!isConnected ? (
        <View style={styles.loginCard}>
          <MaterialCommunityIcons name="account-off-outline" size={80} color={COLORS.muted} />
          <Text style={styles.loginTitle}>Вы не вошли в аккаунт</Text>
          <Text style={styles.loginSubtitle}>
            Войдите, чтобы синхронизировать данные и соревноваться с друзьями
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={signInWithGoogle}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.btnPressed,
              isLoading && styles.btnDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={20} color="#FFF" />
                <Text style={styles.loginButtonText}>ВОЙТИ ЧЕРЕЗ GOOGLE</Text>
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/login_page")}
            style={({ pressed }) => [styles.emailLoginButton, pressed && styles.btnPressed]}
          >
            <Text style={styles.emailLoginButtonText}>ВОЙТИ ПО EMAIL</Text>
          </Pressable>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>НЕТ АККАУНТА?</Text>
            <View style={styles.dividerLine} />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/register_page")}
            style={({ pressed }) => [styles.registerButton, pressed && styles.btnPressed]}
          >
            <MaterialCommunityIcons name="account-plus" size={20} color={COLORS.accent} />
            <Text style={styles.registerButtonText}>ЗАРЕГИСТРИРОВАТЬСЯ</Text>
          </Pressable>
        </View>
      ) : (
        <>
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
                <MaterialCommunityIcons name="account" size={60} color={COLORS.accent} />
              )}
            </View>

            <Text style={styles.name}>{userInfo?.name || "Пользователь"}</Text>
            <Text style={styles.email}>{userInfo?.email || ""}</Text>
          </View>

          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuRow}
              onPress={() => router.push("/settings_page")}
            >
              <MaterialCommunityIcons name="cog-outline" size={22} color={COLORS.accent} style={styles.menuIcon} />
              <Text style={styles.menuText}>НАСТРОЙКИ</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuRow}
              onPress={() => router.push("/friends_page")}
            >
              <MaterialCommunityIcons name="account-group-outline" size={22} color={COLORS.accent} style={styles.menuIcon} />
              <Text style={styles.menuText}>ДРУЗЬЯ</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuRow}
              onPress={() => router.push("/leaderboard_page")}
            >
              <MaterialCommunityIcons name="trophy-outline" size={22} color={COLORS.accent} style={styles.menuIcon} />
              <Text style={styles.menuText}>ЛИДЕРБОРДЫ</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuRow}
              onPress={() => router.push("/achievements_page")}
            >
              <MaterialCommunityIcons name="medal-outline" size={22} color={COLORS.accent} style={styles.menuIcon} />
              <Text style={styles.menuText}>ДОСТИЖЕНИЯ</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.muted} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={signOut}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.btnPressed]}
          >
            <MaterialCommunityIcons name="logout" size={20} color={COLORS.accent} />
            <Text style={styles.logoutText}>ВЫЙТИ ИЗ АККАУНТА</Text>
          </Pressable>
        </>
      )}
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
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDE8E0",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 14, color: "#A4371D" },
  loginCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 7,
  },
  loginTitle: {
    fontSize: 24,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
    marginTop: 16,
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: COLORS.accent,
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
    color: "#FFFFFF",
    fontFamily: "Rimma_sans",
  },
  emailLoginButton: {
    marginTop: 10,
    backgroundColor: COLORS.cream,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 240,
    alignItems: "center",
  },
  emailLoginButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
    width: "100%",
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E8D4A8" },
  dividerText: { fontSize: 12, color: COLORS.muted, fontFamily: "Rimma_sans" },
  registerButton: {
    backgroundColor: COLORS.cream,
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
    color: COLORS.accent,
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
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
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
    overflow: "hidden",
  },
  avatarPhoto: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  name: {
    fontSize: 28,
    color: COLORS.text,
    fontFamily: "Rimma_sans",
    marginTop: 12,
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: "center",
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
  menuDivider: {
    height: 1,
    backgroundColor: "#EBDCC2",
  },
  logoutButton: {
    backgroundColor: COLORS.cream,
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
    color: COLORS.accent,
    fontFamily: "Rimma_sans",
  },
});
