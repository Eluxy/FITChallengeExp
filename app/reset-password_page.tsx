import { useAuth } from "@/src/context/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function ResetPasswordPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const s = createStyles(colors);

  const handleReset = async () => {
    clearError();

    if (!email.trim()) {
      return;
    }

    const success = await resetPassword(email.trim());

    if (success) {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.content}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
          </Pressable>
          <View style={s.successCard}>
            <MaterialCommunityIcons name="email-check" size={64} color={colors.green} />
            <Text style={s.successTitle}>ПИСЬМО ОТПРАВЛЕНО</Text>
            <Text style={s.successText}>
              Проверьте почту{' '}
              <Text style={{ color: colors.text, fontFamily: "Rimma_sans" }}>{email}</Text>
              {' '}и перейдите по ссылке для восстановления пароля
            </Text>
            <Pressable
              style={({ pressed }) => [s.primaryBtn, pressed && s.btnPressed]}
              onPress={() => router.replace("/login_page")}
            >
              <Text style={s.primaryBtnText}>НАЗАД К ВХОДУ</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </Pressable>

        <Text style={s.title}>ВОССТАНОВЛЕНИЕ ПАРОЛЯ</Text>
        <Text style={s.subtitle}>
          Введите email, мы отправим ссылку для сброса пароля
        </Text>

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
          <Pressable
            style={({ pressed }) => [
              s.primaryBtn,
              pressed && s.btnPressed,
              isLoading && s.btnDisabled,
            ]}
            onPress={handleReset}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={s.primaryBtnText}>ОТПРАВИТЬ</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/login_page")}
          style={s.backLink}
        >
          <Text style={s.backText}>
            Вспомнили пароль? <Text style={s.backHighlight}>Войти</Text>
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
    successCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      gap: 16,
      elevation: 5,
      marginTop: 40,
    },
    successTitle: { fontSize: 22, color: colors.text, fontFamily: "Rimma_sans" },
    successText: { fontSize: 14, color: colors.muted, textAlign: "center" },
    backLink: { marginTop: 20, alignItems: "center" },
    backText: { fontSize: 14, color: colors.muted },
    backHighlight: { color: colors.accent, fontFamily: "Rimma_sans" },
  });
}
