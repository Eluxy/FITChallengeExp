import { useRouter } from "expo-router";
import { useRegisterViewModel } from "@/src/presentation/view-models/use-register-view-model";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

export default function RegisterPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
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
  const s = createStyles(colors);

  const displayError = localError || error;

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

        <Text style={s.title}>РЕГИСТРАЦИЯ</Text>
        <Text style={s.subtitle}>Создайте новый аккаунт</Text>

        {displayError ? (
          <View style={s.errorCard}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
            <Text style={s.errorText}>{displayError}</Text>
          </View>
        ) : null}

        <View style={s.formCard}>
          <Text style={s.label}>Имя</Text>
          <TextInput
            style={s.input}
            placeholder="Ваше имя"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
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
            placeholder="Минимум 6 символов"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={s.label}>Подтвердите пароль</Text>
          <TextInput
            style={s.input}
            placeholder="Повторите пароль"
            placeholderTextColor={colors.muted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Pressable
            style={({ pressed }) => [
              s.primaryBtn,
              pressed && s.btnPressed,
              isLoading && s.btnDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={s.primaryBtnText}>ЗАРЕГИСТРИРОВАТЬСЯ</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/login_page")}
          style={s.loginLink}
        >
          <Text style={s.loginText}>
            Уже есть аккаунт? <Text style={s.loginHighlight}>Войти</Text>
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
    loginLink: { marginTop: 20, alignItems: "center" },
    loginText: { fontSize: 14, color: colors.muted },
    loginHighlight: { color: colors.accent, fontFamily: "Rimma_sans" },
  });
}
