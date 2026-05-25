import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useRegisterViewModel } from "@/src/presentation/view-models/use-register-view-model";
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
  bg: "#F8EDAD",
  cream: "#F8EDAD",
  card: "#F8EDAD",
  text: "#ED7C30",
  accent: "#ED7C30",
  muted: "#B35A22",
};

export default function RegisterPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    name, setName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    isLoading,
    error, localError,
    handleRegister,
  } = useRegisterViewModel(() => {
    Alert.alert(
      "Регистрация успешна!",
      `Добро пожаловать, ${name.trim()}!`,
      [
        {
          text: "OK",
          onPress: () => {
            if (router.canGoBack()) {
              router.dismissAll();
            }
            router.replace("/(tabs)");
          },
        },
      ],
    );
  });

  const displayError = localError || error;

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

        <Text style={styles.title}>РЕГИСТРАЦИЯ</Text>
        <Text style={styles.subtitle}>Создайте новый аккаунт</Text>

        {displayError ? (
          <View style={styles.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#A4371D" />
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.label}>Имя</Text>
          <TextInput
            style={styles.input}
            placeholder="Ваше имя"
            placeholderTextColor={COLORS.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
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
            placeholder="Минимум 6 символов"
            placeholderTextColor={COLORS.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={styles.label}>Подтвердите пароль</Text>
          <TextInput
            style={styles.input}
            placeholder="Повторите пароль"
            placeholderTextColor={COLORS.muted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.btnPressed,
              isLoading && styles.btnDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>ЗАРЕГИСТРИРОВАТЬСЯ</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/login_page")}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Уже есть аккаунт? <Text style={styles.loginHighlight}>Войти</Text>
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
  loginLink: { marginTop: 20, alignItems: "center" },
  loginText: { fontSize: 14, color: COLORS.muted },
  loginHighlight: { color: COLORS.accent, fontFamily: "Rimma_sans" },
});
