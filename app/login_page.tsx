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
import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";

export default function LoginPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
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
  const s = createStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </Pressable>

        <Text style={s.title}>ВХОД</Text>
        <Text style={s.subtitle}>Войдите в свой аккаунт</Text>

        {error ? (
          <View style={s.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={s.formCard}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="example@mail.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={s.label}>Пароль</Text>
          <TextInput
            style={s.input}
            placeholder="Введите пароль"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            onPress={() => router.push("/reset-password_page")}
          >
            <Text style={s.forgotLink}>Забыли пароль?</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              s.primaryBtn,
              pressed && s.btnPressed,
              isLoading && s.btnDisabled,
            ]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={s.primaryBtnText}>ВОЙТИ</Text>
            )}
          </Pressable>
        </View>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>ИЛИ</Text>
          <View style={s.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [
            s.googleBtn,
            pressed && s.btnPressed,
            isLoading && s.btnDisabled,
          ]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="google" size={22} color={colors.text} />
          <Text style={s.googleBtnText}>ВОЙТИ ЧЕРЕЗ GOOGLE</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/register_page")}
          style={s.registerLink}
        >
          <Text style={s.registerText}>
            Нет аккаунта? <Text style={s.registerHighlight}>Зарегистрироваться</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 18, paddingBottom: 32 },
    backBtn: { width: 44, height: 44, justifyContent: "center", marginBottom: 8 },
    title: { fontSize: 34, color: colors.text, fontFamily: "Rimma_sans", textAlign: "center" },
    subtitle: { fontSize: 16, color: colors.muted, textAlign: "center", marginBottom: 20 },
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.error + "15",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      gap: 8,
    },
    errorText: { flex: 1, fontSize: 14, color: colors.error },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      gap: 8,
      elevation: 5,
    },
    label: {
      fontSize: 13,
      color: colors.muted,
      fontFamily: "Rimma_sans",
      marginTop: 4,
    },
    input: {
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    forgotLink: {
      fontSize: 14,
      color: colors.accent,
      textAlign: "right",
      fontFamily: "Rimma_sans",
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    primaryBtnText: { fontSize: 18, color: colors.bg, fontFamily: "Rimma_sans" },
    btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    btnDisabled: { opacity: 0.6 },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
      gap: 12,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
    dividerText: { fontSize: 14, color: colors.muted },
    googleBtn: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      elevation: 3,
    },
    googleBtnText: { fontSize: 16, color: colors.text, fontFamily: "Rimma_sans" },
    registerLink: { marginTop: 20, alignItems: "center" },
    registerText: { fontSize: 14, color: colors.muted },
    registerHighlight: { color: colors.accent, fontFamily: "Rimma_sans" },
  });
}
