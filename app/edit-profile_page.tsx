import { useAppTheme, type ThemeColors } from "@/src/context/theme-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useEditProfileViewModel } from "@/src/presentation/view-models/use-edit-profile-view-model";
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

export default function EditProfilePage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const s = createStyles(colors);
  const {
    isLoading,
    isSaving,
    isUploadingPhoto,
    name, setName,
    age, setAge,
    gender, setGender,
    heightCm, setHeightCm,
    weightKg, setWeightKg,
    photoUrl,
    pickImage,
    saveProfile,
  } = useEditProfileViewModel();

  const validateAndSave = async () => {
    const error = await saveProfile();
    if (error) {
      Alert.alert("Ошибка", error);
    } else {
      Alert.alert("Профиль сохранён", "Ваши изменения успешно сохранены", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  if (isLoading) {
    return (
      <View style={[s.root, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
          </Pressable>
          <Text style={s.headerTitle}>РЕДАКТИРОВАТЬ ПРОФИЛЬ</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={s.formCard}>
          <View style={s.photoSection}>
            <View style={s.photoContainer}>
              {photoUrl ? (
                <Text style={s.photoPlaceholder}>
                  {name.trim().charAt(0).toUpperCase() || "?"}
                </Text>
              ) : (
                <MaterialCommunityIcons name="account-circle" size={80} color={colors.accent} />
              )}
              {isUploadingPhoto && (
                <View style={s.photoOverlay}>
                  <ActivityIndicator size="small" color="#FFF" />
                </View>
              )}
            </View>
            <Pressable
              style={s.photoButton}
              onPress={pickImage}
              disabled={isUploadingPhoto}
            >
              <MaterialCommunityIcons name="camera" size={18} color={colors.bg} />
              <Text style={s.photoButtonText}>
                {isUploadingPhoto ? "Загрузка..." : photoUrl ? "Сменить фото" : "Добавить фото"}
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={s.input}
            placeholder="Имя"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={s.input}
            placeholder="Возраст"
            placeholderTextColor={colors.muted}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
          />

          <Text style={s.label}>Пол</Text>
          <View style={s.genderRow}>
            <Pressable
              style={[s.genderBtn, gender === "male" && s.genderActive]}
              onPress={() => setGender("male")}
            >
              <MaterialCommunityIcons name="gender-male" size={22} color={gender === "male" ? colors.bg : colors.text} />
              <Text style={[s.genderText, gender === "male" && s.genderTextActive]}>Муж</Text>
            </Pressable>
            <Pressable
              style={[s.genderBtn, gender === "female" && s.genderActive]}
              onPress={() => setGender("female")}
            >
              <MaterialCommunityIcons name="gender-female" size={22} color={gender === "female" ? colors.bg : colors.text} />
              <Text style={[s.genderText, gender === "female" && s.genderTextActive]}>Жен</Text>
            </Pressable>
          </View>

          <TextInput
            style={s.input}
            placeholder="Рост (см)"
            placeholderTextColor={colors.muted}
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="decimal-pad"
          />

          <TextInput
            style={s.input}
            placeholder="Вес (кг)"
            placeholderTextColor={colors.muted}
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
          />

          <Pressable
            style={({ pressed }) => [
              s.saveBtn,
              pressed && s.btnPressed,
              isSaving && s.btnDisabled,
            ]}
            onPress={validateAndSave}
            disabled={isSaving || isUploadingPhoto}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.saveBtnText}>СОХРАНИТЬ</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { paddingHorizontal: 18, paddingBottom: 32 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.cream,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 14,
    },
    headerTitle: { fontSize: 20, color: colors.text, fontFamily: "Rimma_sans", flex: 1, textAlign: "center" },
    photoSection: {
      alignItems: "center",
      paddingVertical: 8,
      gap: 12,
    },
    photoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.cream,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    photoPlaceholder: {
      fontSize: 40,
      color: colors.accent,
      fontFamily: "Rimma_sans",
    },
    photoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    photoButton: {
      flexDirection: "row",
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: "center",
      gap: 6,
    },
    photoButtonText: {
      fontSize: 14,
      color: colors.bg,
      fontFamily: "Rimma_sans",
    },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      gap: 14,
      elevation: 5,
    },
    input: {
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    label: { fontSize: 14, color: colors.muted, fontFamily: "Rimma_sans" },
    genderRow: { flexDirection: "row", gap: 12 },
    genderBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.cream,
      borderRadius: 12,
      paddingVertical: 12,
    },
    genderActive: { backgroundColor: colors.accent },
    genderText: { fontSize: 16, color: colors.text, fontFamily: "Rimma_sans" },
    genderTextActive: { color: colors.bg },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    saveBtnText: { fontSize: 18, color: colors.bg, fontFamily: "Rimma_sans" },
    btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    btnDisabled: { opacity: 0.6 },
  });
}
