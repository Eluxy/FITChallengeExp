import { useRouter } from "expo-router";
import { useLoginViewModel } from "@/src/presentation/view-models/use-login-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#EFD8A8",
  cream: "#F7E9CC",
  card: "#F6E8CB",
  text: "#111111",
  accent: "#F56735",
  muted: "#8F8A82",
};

export default function LoginPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    email, setEmail,
    password, setPassword,
    isLoading, error,
    handleEmailLogin, handleGoogleLogin,
  } = useLoginViewModel(() => {
    if (router.canGoBack()) {
      router.dismissAll();
    }
    router.replace("/(tabs)");
  });

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </Pressable>

        <Text style={styles.title}>ВХОД</Text>
        <Text style={styles.subtitle}>Войдите в свой аккаунт</Text>

        {error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#A4371D" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="example@mail.com"
            placeholderTextColor={COLORS.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.label}>Пароль</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите пароль"
            placeholderTextColor={COLORS.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            onPress={() => router.push("/reset-password_page")}
          >
            <Text style={styles.forgotLink}>Забыли пароль?</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed,
              isLoading && styles.btnDisabled,
            ]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>ВОЙТИ</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ИЛИ</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.googleBtn,
            pressed && styles.btnPressed,
            isLoading && styles.btnDisabled,
          ]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="google" size={22} color={COLORS.text} />
          <Text style={styles.googleBtnText}>ВОЙТИ ЧЕРЕЗ GOOGLE</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/register_page")}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>
            Нет аккаунта? <Text style={styles.registerHighlight}>Зарегистрироваться</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingBottom: 32 },
  backBtn: { width: 44, height: 44, justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 34, color: COLORS.text, fontFamily: "Rimma_sans", textAlign: "center" },
  subtitle: { fontSize: 16, color: COLORS.muted, textAlign: "center", marginBottom: 20 },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDE8E0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 14, color: "#A4371D" },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    gap: 8,
    elevation: 5,
  },
  label: {
    fontSize: 13,
    color: COLORS.muted,
    fontFamily: "Rimma_sans",
    marginTop: 4,
  },
  input: {
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  forgotLink: {
    fontSize: 14,
    color: COLORS.accent,
    textAlign: "right",
    fontFamily: "Rimma_sans",
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 18, color: "#FFF", fontFamily: "Rimma_sans" },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E8D4A8" },
  dividerText: { fontSize: 14, color: COLORS.muted },
  googleBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 3,
  },
  googleBtnText: { fontSize: 16, color: COLORS.text, fontFamily: "Rimma_sans" },
  registerLink: { marginTop: 20, alignItems: "center" },
  registerText: { fontSize: 14, color: COLORS.muted },
  registerHighlight: { color: COLORS.accent, fontFamily: "Rimma_sans" },
});
