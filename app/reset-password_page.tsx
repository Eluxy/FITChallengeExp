import { useAuth } from "@/src/context/auth-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  green: "#48B75A",
};

export default function ResetPasswordPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) return;
    clearError();
    await resetPassword(email.trim());
    if (!error) {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
          </Pressable>
          <View style={styles.successCard}>
            <MaterialCommunityIcons name="check-circle" size={64} color={COLORS.green} />
            <Text style={styles.successTitle}>ПИСЬМО ОТПРАВЛЕНО</Text>
            <Text style={styles.successText}>
              Проверьте почту {email} и перейдите по ссылке для восстановления пароля
            </Text>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              onPress={() => router.push("/login_page")}
            >
              <Text style={styles.primaryBtnText}>НАЗАД К ВХОДУ</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </Pressable>

        <Text style={styles.title}>ВОССТАНОВЛЕНИЕ ПАРОЛЯ</Text>
        <Text style={styles.subtitle}>
          Введите email, мы отправим ссылку для сброса пароля
        </Text>

        {error ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#A4371D" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed,
              isLoading && styles.btnDisabled,
            ]}
            onPress={handleReset}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>ОТПРАВИТЬ</Text>
            )}
          </Pressable>
        </View>
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
    gap: 12,
    elevation: 5,
  },
  input: {
    backgroundColor: COLORS.cream,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 18, color: "#FFF", fontFamily: "Rimma_sans" },
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
  successCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 12,
    elevation: 5,
    marginTop: 40,
  },
  successTitle: { fontSize: 22, color: COLORS.text, fontFamily: "Rimma_sans" },
  successText: { fontSize: 14, color: COLORS.muted, textAlign: "center" },
});
